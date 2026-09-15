package com.example.BigBite.order;

import com.example.BigBite.order.dto.BillDto;
import com.example.BigBite.order.dto.BillItemDto;
import com.example.BigBite.order.dto.OrderItemRequestDto;
import com.example.BigBite.order.dto.OrderItemResponseDto;
import com.example.BigBite.order.dto.OrderRequestDto;
import com.example.BigBite.order.dto.OrderResponseDto;
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

    private final OrderRepository orderRepository;
    private final BranchLookupService branchLookupService;
    private final MenuLookupService menuLookupService;
    private final PromotionValidationService promotionValidationService;
    private final InventoryCheckService inventoryCheckService;

    public OrderService(OrderRepository orderRepository,
                        BranchLookupService branchLookupService,
                        MenuLookupService menuLookupService,
                        PromotionValidationService promotionValidationService,
                        InventoryCheckService inventoryCheckService) {
        this.orderRepository = orderRepository;
        this.branchLookupService = branchLookupService;
        this.menuLookupService = menuLookupService;
        this.promotionValidationService = promotionValidationService;
        this.inventoryCheckService = inventoryCheckService;
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

        if (request.getCustomerId() == null) {
            if (request.getGuestName() == null || request.getGuestName().trim().isEmpty()) {
                throw new IllegalArgumentException("guestName is required for guest checkout");
            }
            if (request.getGuestPhone() == null || request.getGuestPhone().trim().isEmpty()) {
                throw new IllegalArgumentException("guestPhone is required for guest checkout");
            }
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        Order order = new Order();
        order.setCustomerId(request.getCustomerId());
        order.setGuestName(request.getGuestName() != null ? request.getGuestName().trim() : null);
        order.setGuestPhone(request.getGuestPhone() != null ? request.getGuestPhone().trim() : null);
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
        Order order = findOrderOrThrow(id);

        if (success) {
            order.setPaymentStatus(PaymentStatus.VERIFIED);
            if (order.getStatus() == OrderStatus.PLACED) {
                order.setStatus(OrderStatus.PAYMENT_VERIFIED);
            }
        } else {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }

        Order updated = orderRepository.save(order);
        return toOrderResponseDto(updated);
    }

    private void validateTransition(Order order, OrderStatus current, OrderStatus next) {
        if (current == OrderStatus.CANCELLED || current == OrderStatus.COMPLETED) {
            throw new IllegalStateException("Order is in terminal status " + current + " and cannot be transitioned");
        }

        boolean isValid = switch (current) {
            case PLACED -> next == OrderStatus.PAYMENT_VERIFIED;
            case PAYMENT_VERIFIED -> next == OrderStatus.CONFIRMED;
            case CONFIRMED -> next == OrderStatus.PREPARING;
            case PREPARING -> {
                if (order.getFulfillmentType() == FulfillmentType.DELIVERY) {
                    yield next == OrderStatus.OUT_FOR_DELIVERY;
                } else {
                    yield next == OrderStatus.READY_FOR_PICKUP;
                }
            }
            case OUT_FOR_DELIVERY -> next == OrderStatus.DELIVERED;
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

    private OrderResponseDto toOrderResponseDto(Order order) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomerId());
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
