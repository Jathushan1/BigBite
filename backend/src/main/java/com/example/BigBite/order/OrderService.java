package com.example.BigBite.order;

import com.example.BigBite.order.dto.BillDto;
import com.example.BigBite.order.dto.BillItemDto;
import com.example.BigBite.order.dto.OrderItemRequestDto;
import com.example.BigBite.order.dto.OrderItemResponseDto;
import com.example.BigBite.order.dto.OrderRequestDto;
import com.example.BigBite.order.dto.OrderResponseDto;
import com.example.BigBite.order.dto.PaymentRequestDto;
import com.example.BigBite.order.external.BranchLookupService;
import com.example.BigBite.order.external.InventoryCheckService;
import com.example.BigBite.order.external.MenuLookupService;
import com.example.BigBite.order.external.PromotionValidationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class OrderService {

    private static final BigDecimal TAX_RATE = new BigDecimal("0.05");
    private static final BigDecimal TAX_PERCENT = new BigDecimal("5.00");
    private static final BigDecimal FLAT_DELIVERY_FEE = new BigDecimal("300.00");
    private static final Set<OrderStatus> CANCELLABLE_STATUSES = Set.of(
            OrderStatus.PLACED,
            OrderStatus.PAYMENT_VERIFIED,
            OrderStatus.CONFIRMED
    );

    public static final String SRI_LANKAN_PHONE_REGEX = "^(?:\\+94|0)[1-9][0-9]{8}$";

    private final OrderRepository orderRepository;
    private final BranchLookupService branchLookupService;
    private final MenuLookupService menuLookupService;
    private final PromotionValidationService promotionValidationService;
    private final InventoryCheckService inventoryCheckService;
    private final SavedAddressRepository savedAddressRepository;

    public OrderService(OrderRepository orderRepository,
                        BranchLookupService branchLookupService,
                        MenuLookupService menuLookupService,
                        PromotionValidationService promotionValidationService,
                        InventoryCheckService inventoryCheckService,
                        SavedAddressRepository savedAddressRepository) {
        this.orderRepository = orderRepository;
        this.branchLookupService = branchLookupService;
        this.menuLookupService = menuLookupService;
        this.promotionValidationService = promotionValidationService;
        this.inventoryCheckService = inventoryCheckService;
        this.savedAddressRepository = savedAddressRepository;
    }

    public OrderResponseDto placeOrder(OrderRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Order request must not be null");
        }

        Long branchId = request.getBranchId();
        if (branchId == null) {
            throw new IllegalArgumentException("branchId is required");
        }

        if (!branchLookupService.branchExists(branchId) || !branchLookupService.isBranchOpen(branchId)) {
            throw new IllegalArgumentException("Branch " + branchId + " does not exist or is currently closed");
        }

        if (request.getFulfillmentType() == null) {
            throw new IllegalArgumentException("fulfillmentType is required");
        }

        if (request.getFulfillmentType() == FulfillmentType.TAKEAWAY && !branchLookupService.supportsTakeaway(branchId)) {
            throw new IllegalArgumentException("Branch " + branchId + " does not support takeaway fulfillment");
        }

        if (request.getFulfillmentType() == FulfillmentType.DELIVERY) {
            if (request.getDeliveryAddress() == null || request.getDeliveryAddress().trim().isEmpty()) {
                throw new IllegalArgumentException("Delivery address is required for DELIVERY fulfillment");
            }
        }

        String contactName = request.getEffectiveContactName();
        String contactPhone = request.getEffectiveContactPhone();

        if (request.getCustomerId() == null) {
            if (contactName == null || contactName.trim().isEmpty()) {
                throw new IllegalArgumentException("guestName is required for guest checkout");
            }
            if (contactPhone == null || contactPhone.trim().isEmpty()) {
                throw new IllegalArgumentException("guestPhone is required for guest checkout");
            }
        }

        if (contactPhone != null && !contactPhone.trim().isEmpty()) {
            if (!contactPhone.trim().matches(SRI_LANKAN_PHONE_REGEX)) {
                throw new IllegalArgumentException("Invalid Sri Lankan phone number format. Must be 07XXXXXXXX or +947XXXXXXXX");
            }
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        Order order = new Order();
        order.setCustomerId(request.getCustomerId());
        order.setContactName(contactName);
        order.setContactPhone(contactPhone);
        order.setGuestName(contactName);
        order.setGuestPhone(contactPhone);
        order.setGuestEmail(request.getGuestEmail() != null ? request.getGuestEmail().trim() : null);
        order.setBranchId(branchId);
        order.setFulfillmentType(request.getFulfillmentType());
        order.setDeliveryAddress(request.getDeliveryAddress() != null ? request.getDeliveryAddress().trim() : null);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (OrderItemRequestDto itemReq : request.getItems()) {
            if (itemReq.getMenuItemId() == null) {
                throw new IllegalArgumentException("menuItemId is required for each order item");
            }
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Item quantity must be greater than zero");
            }

            MenuLookupService.MenuItemInfo itemInfo = menuLookupService.getItem(itemReq.getMenuItemId());
            if (itemInfo == null || !menuLookupService.isAvailable(itemReq.getMenuItemId())) {
                throw new IllegalArgumentException("Menu item " + itemReq.getMenuItemId() + " is not available");
            }

            if (!Objects.equals(itemInfo.branchId(), branchId)) {
                throw new IllegalArgumentException("Menu item " + itemReq.getMenuItemId() +
                        " belongs to branch " + itemInfo.branchId() + ", not order branch " + branchId);
            }

            if (!inventoryCheckService.isInStock(itemReq.getMenuItemId(), itemReq.getQuantity())) {
                throw new IllegalArgumentException("Menu item " + itemReq.getMenuItemId() + " has insufficient stock");
            }

            inventoryCheckService.decrementStock(itemReq.getMenuItemId(), itemReq.getQuantity());

            BigDecimal unitPrice = itemInfo.price().setScale(2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity())).setScale(2, RoundingMode.HALF_UP);

            OrderItem orderItem = new OrderItem(
                    itemReq.getMenuItemId(),
                    itemInfo.name(),
                    unitPrice,
                    itemReq.getQuantity(),
                    lineTotal
            );
            order.addItem(orderItem);

            subtotal = subtotal.add(lineTotal);
        }

        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));

        BigDecimal deliveryFee = (request.getFulfillmentType() == FulfillmentType.DELIVERY)
                ? FLAT_DELIVERY_FEE.setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        order.setDeliveryFee(deliveryFee);

        BigDecimal taxAmount = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        order.setTaxAmount(taxAmount);

        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (request.getPromoCode() != null && !request.getPromoCode().trim().isEmpty()) {
            PromotionValidationService.DiscountResult discountResult =
                    promotionValidationService.validate(request.getPromoCode().trim(), subtotal);
            if (discountResult.valid() && discountResult.discountAmount() != null) {
                discountAmount = discountResult.discountAmount().setScale(2, RoundingMode.HALF_UP);
                order.setPromoCode(request.getPromoCode().trim().toUpperCase());
            }
        }
        order.setDiscountAmount(discountAmount);

        BigDecimal grandTotal = subtotal.add(deliveryFee).add(taxAmount).subtract(discountAmount);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }
        order.setGrandTotal(grandTotal.setScale(2, RoundingMode.HALF_UP));

        Order saved = orderRepository.save(order);

        if (request.isSaveAddress() && request.getCustomerId() != null && request.getDeliveryAddress() != null && !request.getDeliveryAddress().trim().isEmpty()) {
            String addr = request.getDeliveryAddress().trim();
            if (savedAddressRepository != null && !savedAddressRepository.existsByCustomerIdAndAddressLine(request.getCustomerId(), addr)) {
                savedAddressRepository.save(new SavedAddress(request.getCustomerId(), addr, request.getCity()));
            }
        }

        return toOrderResponseDto(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponseDto getOrderById(Long id) {
        Order order = findOrderOrThrow(id);
        return toOrderResponseDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponseDto> getOrders(Long customerId, Long branchId, OrderStatus status) {
        List<Order> orders;
        if (customerId != null) {
            orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
        } else if (branchId != null && status != null) {
            orders = orderRepository.findByBranchIdAndStatusOrderByCreatedAtDesc(branchId, status);
        } else if (branchId != null) {
            orders = orderRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
        } else if (status != null) {
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(status);
        } else {
            orders = orderRepository.findAllByOrderByCreatedAtDesc();
        }

        return orders.stream().map(this::toOrderResponseDto).toList();
    }

    public OrderResponseDto updateOrderStatus(Long id, OrderStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("New status must not be null");
        }

        Order order = findOrderOrThrow(id);
        OrderStatus current = order.getStatus();

        if (current == newStatus) {
            return toOrderResponseDto(order);
        }

        if (newStatus == OrderStatus.CANCELLED) {
            return cancelOrder(id);
        }

        validateTransition(order, current, newStatus);

        order.setStatus(newStatus);
        Order updated = orderRepository.save(order);
        return toOrderResponseDto(updated);
    }

    public OrderResponseDto cancelOrder(Long id) {
        Order order = findOrderOrThrow(id);
        OrderStatus current = order.getStatus();

        if (current == OrderStatus.CANCELLED) {
            return toOrderResponseDto(order);
        }

        if (!CANCELLABLE_STATUSES.contains(current)) {
            throw new IllegalStateException("Cannot cancel order once preparation has started. Current status: " + current);
        }

        order.setStatus(OrderStatus.CANCELLED);
        Order updated = orderRepository.save(order);
        return toOrderResponseDto(updated);
    }

    @Transactional(readOnly = true)
    public BillDto getOrderBill(Long id) {
        Order order = findOrderOrThrow(id);

        BillDto bill = new BillDto();
        bill.setOrderId(order.getId());
        bill.setCustomerId(order.getCustomerId());
        bill.setCustomerOrGuestName(order.getCustomerId() != null ? "Customer #" + order.getCustomerId() : order.getGuestName());
        bill.setBranchId(order.getBranchId());
        bill.setFulfillmentType(order.getFulfillmentType());
        bill.setDeliveryAddress(order.getDeliveryAddress());

        List<BillItemDto> billItems = order.getItems().stream()
                .map(item -> new BillItemDto(
                        item.getMenuItemId(),
                        item.getItemNameSnapshot(),
                        item.getUnitPriceSnapshot(),
                        item.getQuantity(),
                        item.getLineTotal()
                ))
                .toList();

        bill.setItems(billItems);
        bill.setSubtotal(order.getSubtotal());
        bill.setDeliveryFee(order.getDeliveryFee());
        bill.setTaxRatePercent(TAX_PERCENT);
        bill.setTaxAmount(order.getTaxAmount());
        bill.setPromoCode(order.getPromoCode());
        bill.setDiscountAmount(order.getDiscountAmount());
        bill.setGrandTotal(order.getGrandTotal());
        bill.setPaymentStatus(order.getPaymentStatus());
        bill.setOrderStatus(order.getStatus());
        bill.setCreatedAt(order.getCreatedAt());

        return bill;
    }

    public OrderResponseDto recordPayment(Long id, boolean success) {
        return recordPayment(id, new PaymentRequestDto(PaymentMethod.CARD_STRIPE, success));
    }

    public OrderResponseDto recordPayment(Long id, PaymentRequestDto request) {
        Order order = findOrderOrThrow(id);

        PaymentMethod method = (request != null && request.getPaymentMethod() != null)
                ? request.getPaymentMethod()
                : PaymentMethod.CARD_STRIPE;

        if (method == PaymentMethod.CASH_ON_DELIVERY) {
            BigDecimal codLimit = new BigDecimal("3000.00");
            if (order.getGrandTotal().compareTo(codLimit) > 0) {
                throw new IllegalArgumentException("Cash on Delivery is only allowed for orders up to LKR 3,000. Order total is LKR " + order.getGrandTotal());
            }
            order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setStatus(OrderStatus.CONFIRMED);
        } else {
            order.setPaymentMethod(PaymentMethod.CARD_STRIPE);
            if (request != null && request.getStripePaymentIntentId() != null) {
                order.setStripePaymentIntentId(request.getStripePaymentIntentId());
            }

            boolean isSuccessful = request != null && request.isSuccess();
            if (isSuccessful) {
                order.setPaymentStatus(PaymentStatus.VERIFIED);
                order.setStatus(OrderStatus.CONFIRMED);
            } else {
                order.setPaymentStatus(PaymentStatus.FAILED);
                // Order status stays in current state (PLACED), allowing the customer to retry
            }
        }

        Order updated = orderRepository.save(order);
        return toOrderResponseDto(updated);
    }

    @Transactional(readOnly = true)
    public com.example.BigBite.order.dto.PaymentIntentResponseDto createPaymentIntent(Long id) {
        Order order = findOrderOrThrow(id);
        String mockClientSecret = "pi_mock_" + order.getId() + "_" + System.currentTimeMillis() + "_secret_mock";
        String publishableKey = "pk_test_bigbite_sandbox";
        return new com.example.BigBite.order.dto.PaymentIntentResponseDto(
                mockClientSecret,
                publishableKey,
                order.getId(),
                order.getGrandTotal(),
                "lkr"
        );
    }

    private void validateTransition(Order order, OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.CANCELLED || current == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Order is in terminal status " + current + " and cannot be transitioned");
        }

        boolean isValid = switch (current) {
            case PLACED -> next == OrderStatus.PAYMENT_VERIFIED || next == OrderStatus.CONFIRMED;
            case PAYMENT_VERIFIED -> next == OrderStatus.CONFIRMED;
            case CONFIRMED -> next == OrderStatus.PREPARING;
            case PREPARING -> {
                if (order.getFulfillmentType() == FulfillmentType.DELIVERY) {
                    yield next == OrderStatus.OUT_FOR_DELIVERY;
                } else {
                    yield next == OrderStatus.READY_FOR_PICKUP;
                }
            }
            case OUT_FOR_DELIVERY -> next == OrderStatus.DELIVERED || next == OrderStatus.COMPLETED;
            case DELIVERED, READY_FOR_PICKUP -> next == OrderStatus.COMPLETED;
            default -> false;
        };

        if (!isValid) {
            throw new IllegalStateException("Invalid status transition from " + current + " to " + next +
                    " for fulfillment type " + order.getFulfillmentType());
        }
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order with id " + id + " not found"));
    }

    @Transactional(readOnly = true)
    public List<SavedAddress> getSavedAddresses(Long customerId) {
        if (customerId == null || savedAddressRepository == null) return List.of();
        return savedAddressRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    public SavedAddress saveAddress(Long customerId, String addressLine, String city) {
        if (customerId == null || addressLine == null || addressLine.trim().isEmpty()) {
            throw new IllegalArgumentException("Customer ID and address line are required");
        }
        return savedAddressRepository.save(new SavedAddress(customerId, addressLine.trim(), city));
    }

    private OrderResponseDto toOrderResponseDto(Order order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomerId());
        dto.setContactName(order.getContactName());
        dto.setContactPhone(order.getContactPhone());
        dto.setGuestName(order.getGuestName());
        dto.setGuestPhone(order.getGuestPhone());
        dto.setGuestEmail(order.getGuestEmail());
        dto.setBranchId(order.getBranchId());
        dto.setFulfillmentType(order.getFulfillmentType());
        dto.setDeliveryAddress(order.getDeliveryAddress());
        dto.setStatus(order.getStatus());
        dto.setSubtotal(order.getSubtotal());
        dto.setDeliveryFee(order.getDeliveryFee());
        dto.setTaxAmount(order.getTaxAmount());
        dto.setDiscountAmount(order.getDiscountAmount());
        dto.setGrandTotal(order.getGrandTotal());
        dto.setPromoCode(order.getPromoCode());
        dto.setPaymentStatus(order.getPaymentStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());

        List<OrderItemResponseDto> itemDtos = order.getItems().stream()
                .map(item -> new OrderItemResponseDto(
                        item.getId(),
                        item.getMenuItemId(),
                        item.getItemNameSnapshot(),
                        item.getUnitPriceSnapshot(),
                        item.getQuantity(),
                        item.getLineTotal()
                ))
                .toList();
        dto.setItems(itemDtos);

        return dto;
    }
}
