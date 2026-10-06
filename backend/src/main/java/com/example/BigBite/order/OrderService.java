package com.example.BigBite.order;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.order.dto.BillDto;
import com.example.BigBite.order.dto.BillItemDto;
import com.example.BigBite.order.dto.ClaimOrdersResponseDto;
import com.example.BigBite.order.dto.FeedbackDto;
import com.example.BigBite.order.dto.OrderItemRequestDto;
import com.example.BigBite.order.dto.OrderItemResponseDto;
import com.example.BigBite.order.dto.OrderRequestDto;
import com.example.BigBite.order.dto.OrderResponseDto;
import com.example.BigBite.order.dto.OrderStatusHistoryDto;
import com.example.BigBite.order.dto.PaymentOptionsDto;
import com.example.BigBite.order.dto.PaymentRequestDto;
import com.example.BigBite.order.dto.SavedAddressDto;
import com.example.BigBite.order.event.OrderEvents;
import com.example.BigBite.order.external.BranchLookupService;
import com.example.BigBite.order.external.CardValidator;
import com.example.BigBite.order.external.ComplaintService;
import com.example.BigBite.order.external.DeliveryService;
import com.example.BigBite.order.external.InventoryService;
import com.example.BigBite.order.external.InventoryService.OrderLine;
import com.example.BigBite.order.external.MenuLookupService;
import com.example.BigBite.order.external.PaymentGateway;
import com.example.BigBite.order.external.PromotionService;
import com.example.BigBite.order.external.RefundGateway;
import com.example.BigBite.order.external.ReviewService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    @Value("${bigbite.order.tax-rate:0.05}")
    private BigDecimal taxRate = new BigDecimal("0.05");
    @Value("${bigbite.order.delivery-fee:300.00}")
    private BigDecimal flatDeliveryFee = new BigDecimal("300.00");
    @Value("${bigbite.order.payment-timeout-minutes:15}")
    private int paymentTimeoutMinutes = 15;
    @Value("${bigbite.order.acceptance-timeout-minutes:10}")
    private int acceptanceTimeoutMinutes = 10;
    @Value("${bigbite.order.max-card-attempts:3}")
    private int maxCardAttempts = 3;
    @Value("${bigbite.order.max-refund-attempts:5}")
    private int maxRefundAttempts = 5;
    @Value("${bigbite.order.min-subtotal:500.00}")
    private BigDecimal minimumOrderSubtotal = new BigDecimal("500.00");
    @Value("${bigbite.order.complaint-window-hours:48}")
    private int complaintWindowHours = 48;
    public static final int MAX_DISTINCT_ITEMS = 20;
    public static final int MAX_ITEM_QUANTITY = 50;

    /** Statuses a customer (or guest) can cancel straight away, before the branch accepts. */
    private static final Set<OrderStatus> CUSTOMER_CANCELLABLE = Set.of(OrderStatus.PLACED, OrderStatus.PAYMENT_VERIFIED);
    /** After acceptance the customer must ask; staff decide. */
    private static final Set<OrderStatus> CANCEL_REQUESTABLE = Set.of(OrderStatus.CONFIRMED, OrderStatus.PREPARING);
    /** Statuses branch staff or the admin can still cancel (food has not left the branch). */
    private static final Set<OrderStatus> STAFF_CANCELLABLE = Set.of(OrderStatus.PLACED, OrderStatus.PAYMENT_VERIFIED,
            OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP);
    private static final Set<OrderStatus> COMPLAINABLE = Set.of(OrderStatus.DELIVERED, OrderStatus.COMPLETED,
            OrderStatus.DELIVERY_FAILED);

    public static final String SRI_LANKAN_PHONE_REGEX = "^(?:\\+94|0)[1-9][0-9]{8}$";

    private final OrderRepository orderRepository;
    private final BranchLookupService branchLookupService;
    private final MenuLookupService menuLookupService;
    private final PromotionService promotionService;
    private final InventoryService inventoryService;
    private final SavedAddressRepository savedAddressRepository;
    private final GuestTokenService guestTokenService;
    private final OrderStatusHistoryRepository historyRepository;
    private final PaymentAttemptRepository paymentAttemptRepository;
    private final PaymentGateway paymentGateway;
    private final RefundGateway refundGateway;
    private final CodEligibilityService codEligibilityService;
    private final OrderTransitionGuard transitionGuard;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final OrderAccessGuard accessGuard;
    private final DeliveryService deliveryService;
    private final ReviewService reviewService;
    private final ComplaintService complaintService;
    private final ObjectMapper json = new ObjectMapper();

    public OrderService(OrderRepository orderRepository,
                        BranchLookupService branchLookupService,
                        MenuLookupService menuLookupService,
                        PromotionService promotionService,
                        InventoryService inventoryService,
                        SavedAddressRepository savedAddressRepository,
                        GuestTokenService guestTokenService,
                        OrderStatusHistoryRepository historyRepository,
                        PaymentAttemptRepository paymentAttemptRepository,
                        PaymentGateway paymentGateway,
                        RefundGateway refundGateway,
                        CodEligibilityService codEligibilityService,
                        OrderTransitionGuard transitionGuard,
                        UserRepository userRepository,
                        ApplicationEventPublisher eventPublisher,
                        OrderAccessGuard accessGuard,
                        DeliveryService deliveryService,
                        ReviewService reviewService,
                        ComplaintService complaintService) {
        this.orderRepository = orderRepository;
        this.branchLookupService = branchLookupService;
        this.menuLookupService = menuLookupService;
        this.promotionService = promotionService;
        this.inventoryService = inventoryService;
        this.savedAddressRepository = savedAddressRepository;
        this.guestTokenService = guestTokenService;
        this.historyRepository = historyRepository;
        this.paymentAttemptRepository = paymentAttemptRepository;
        this.paymentGateway = paymentGateway;
        this.refundGateway = refundGateway;
        this.codEligibilityService = codEligibilityService;
        this.transitionGuard = transitionGuard;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.accessGuard = accessGuard;
        this.deliveryService = deliveryService;
        this.reviewService = reviewService;
        this.complaintService = complaintService;
    }

    // ------------------------------------------------------------------ access-checked entry points

    public OrderResponseDto getOrderFor(Long id, User actor, String guestToken) {
        accessGuard.requireView(id, actor, guestToken);
        return getOrderById(id);
    }

    public OrderResponseDto placeOrderFor(OrderRequestDto request, User actor, String existingGuestToken) {
        accessGuard.requireUsableAccount(actor);
        if (actor != null && actor.getRole() != Role.CUSTOMER) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "CUSTOMER_REQUIRED", "Only customers can place personal orders");
        }
        request.setCustomerId(actor != null ? actor.getId() : null);
        return placeOrder(request, existingGuestToken);
    }

    public BillDto getBillFor(Long id, User actor, String guestToken) {
        accessGuard.requireView(id, actor, guestToken);
        return getOrderBill(id);
    }

    public List<OrderStatusHistoryDto> getHistoryFor(Long id, User actor, String guestToken) {
        accessGuard.requireView(id, actor, guestToken);
        return getStatusHistory(id).stream().map(OrderStatusHistoryDto::fromEntity).toList();
    }

    public PaymentOptionsDto getPaymentOptionsFor(Long id, User actor, String guestToken) {
        accessGuard.requireCustomerAction(id, actor, guestToken);
        return getPaymentOptions(id);
    }

    public List<OrderResponseDto> getOrdersFor(Long customerId, Long branchId, OrderStatus status, User actor) {
        accessGuard.requireList(actor, customerId, branchId);
        List<OrderResponseDto> result = getOrders(customerId, branchId, status);
        if (actor.getRole() == Role.DELIVERY_PARTNER) {
            return result.stream().filter(order -> actor.getId().equals(order.getRiderId())).toList();
        }
        return result;
    }

    public OrderResponseDto cancelOrderFor(Long id, User actor, String guestToken, String reason) {
        accessGuard.requireCancel(id, actor, guestToken);
        return cancelOrder(id, actor, reason);
    }

    public OrderResponseDto updateOrderItemFor(Long id, Long itemId, Integer quantity, User actor, String guestToken) {
        accessGuard.requireCustomerAction(id, actor, guestToken);
        return updateOrderItem(id, itemId, quantity);
    }

    public PaymentResult recordPaymentFor(Long id, PaymentRequestDto request, String key, User actor, String guestToken) {
        accessGuard.requireCustomerAction(id, actor, guestToken);
        return recordPayment(id, request, key);
    }

    public ClaimOrdersResponseDto claimGuestOrderFor(Long orderId, Long customerId, String guestToken) {
        accessGuard.requireGuestToken(orderId, guestToken);
        return claimGuestOrder(orderId, customerId);
    }

    public List<SavedAddressDto> getSavedAddressesFor(Long customerId, User actor) {
        accessGuard.requireAddressOwner(actor, customerId);
        return getSavedAddresses(customerId).stream().map(SavedAddressDto::fromEntity).toList();
    }

    public SavedAddressDto saveAddressFor(Long customerId, String addressLine, String city, User actor) {
        accessGuard.requireAddressOwner(actor, customerId);
        return SavedAddressDto.fromEntity(saveAddress(customerId, addressLine, city));
    }

    public OrderResponseDto acceptOrderFor(Long id, User actor) {
        accessGuard.requireStaffAction(id, actor);
        return updateOrderStatus(id, OrderStatus.CONFIRMED, actor, null, "Accepted by branch");
    }

    public OrderResponseDto rejectOrderFor(Long id, User actor, String reason) {
        accessGuard.requireStaffAction(id, actor);
        return rejectOrder(id, actor, reason);
    }

    public OrderResponseDto requestCancellationFor(Long id, User actor, String guestToken, String reason) {
        accessGuard.requireCustomerAction(id, actor, guestToken);
        return requestCancellation(id, actor, reason);
    }

    public OrderResponseDto resolveCancellationFor(Long id, User actor, boolean approve, String note) {
        accessGuard.requireStaffAction(id, actor);
        return resolveCancellation(id, actor, approve, note);
    }

    public OrderResponseDto retryRefundFor(Long id, User actor) {
        accessGuard.requireStaffAction(id, actor);
        return retryRefund(id, actor);
    }

    public DeliveryService.Tracking getTrackingFor(Long id, User actor, String guestToken) {
        accessGuard.requireView(id, actor, guestToken);
        return deliveryService.track(id);
    }

    public List<DeliveryService.RiderAvailability> getRidersFor(User actor) {
        accessGuard.requireUsableAccount(actor);
        if (actor == null || actor.getRole() != Role.STAFF || actor.getBranchId() == null) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "STAFF_REQUIRED",
                    "Assigned branch staff are required to choose a rider");
        }
        return deliveryService.ridersFor(actor.getBranchId());
    }

    public List<OrderResponseDto> getRefundQueueFor(Long branchId, User actor) {
        accessGuard.requireBranchQueue(actor, branchId);
        return orderRepository.findByBranchIdAndRefundStatusOrderByCreatedAtDesc(branchId, RefundStatus.PENDING)
                .stream().map(this::toOrderResponseDto).toList();
    }

    public List<OrderResponseDto> getCancelRequestQueueFor(Long branchId, User actor) {
        accessGuard.requireBranchQueue(actor, branchId);
        return orderRepository.findByBranchIdAndCancelRequestStatusOrderByCreatedAtDesc(branchId, CancelRequestStatus.PENDING)
                .stream().map(this::toOrderResponseDto).toList();
    }

    public List<ComplaintService.Complaint> getComplaintsFor(Long branchId, User actor) {
        accessGuard.requireBranchQueue(actor, branchId);
        return complaintService.listForBranch(branchId);
    }

    public List<ReviewService.Review> getReviewsFor(Long branchId, User actor) {
        accessGuard.requireBranchQueue(actor, branchId);
        return reviewService.listForBranch(branchId);
    }

    public FeedbackDto getFeedbackFor(Long id, User actor, String guestToken) {
        Order order = accessGuard.requireView(id, actor, guestToken);
        boolean owner = isOwnerOrGuest(order, actor, guestToken);
        Optional<ReviewService.Review> review = reviewService.findByOrder(id);
        return new FeedbackDto(review.orElse(null), complaintService.listForOrder(id),
                owner && review.isEmpty() && order.getStatus() == OrderStatus.COMPLETED,
                owner && complaintWindowOpen(order));
    }

    public ReviewService.Review submitReviewFor(Long id, User actor, String guestToken, int rating, String comment) {
        Order order = accessGuard.requireCustomerAction(id, actor, guestToken);
        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new OrderApiException(HttpStatus.CONFLICT, "REVIEW_NOT_ALLOWED", "You can review an order once it is completed");
        }
        if (reviewService.findByOrder(id).isPresent()) {
            throw new OrderApiException(HttpStatus.CONFLICT, "ALREADY_REVIEWED", "This order has already been reviewed");
        }
        String trimmed = comment == null ? null : comment.trim();
        return reviewService.submit(id, order.getBranchId(), order.getCustomerId(), order.getContactName(), rating, trimmed);
    }

    public ComplaintService.Complaint fileComplaintFor(Long id, User actor, String guestToken, String category, String description) {
        Order order = accessGuard.requireCustomerAction(id, actor, guestToken);
        String normalized = category == null ? "" : category.trim().toUpperCase();
        if (!ComplaintService.CATEGORIES.contains(normalized)) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_CATEGORY", "Choose a valid complaint category");
        }
        if (!complaintWindowOpen(order)) {
            throw new OrderApiException(HttpStatus.CONFLICT, "COMPLAINT_NOT_ALLOWED",
                    "Complaints can be raised within " + complaintWindowHours + " hours of delivery or collection");
        }
        return complaintService.file(id, order.getBranchId(), order.getCustomerId(), order.getContactName(),
                normalized, description.trim());
    }

    private boolean complaintWindowOpen(Order order) {
        if (!COMPLAINABLE.contains(order.getStatus())) return false;
        LocalDateTime reference = order.getDeliveredAt() != null ? order.getDeliveredAt() : order.getUpdatedAt();
        return reference == null || Duration.between(reference, LocalDateTime.now()).toHours() < complaintWindowHours;
    }

    private boolean isOwnerOrGuest(Order order, User actor, String guestToken) {
        if (actor != null && actor.getRole() == Role.CUSTOMER && actor.getId().equals(order.getCustomerId())) return true;
        return guestTokenService.matches(order, guestToken);
    }

    // ------------------------------------------------------------------ placement

    OrderResponseDto placeOrder(OrderRequestDto request) {
        return placeOrder(request, null);
    }

    OrderResponseDto placeOrder(OrderRequestDto request, String existingGuestToken) {
        if (request == null) {
            throw new IllegalArgumentException("Order request must not be null");
        }
        if (request.getItems() != null && request.getItems().stream().anyMatch(Objects::isNull)) {
            throw new IllegalArgumentException("Order items must not contain null entries");
        }
        String requestFingerprint = creationFingerprint(request);

        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            Optional<Order> existingOrder = orderRepository.findByIdempotencyKey(request.getIdempotencyKey().trim());
            if (existingOrder.isPresent()) {
                Order existing = existingOrder.get();
                if (!Objects.equals(existing.getCustomerId(), request.getCustomerId())
                        || (existing.getCustomerId() == null && !Objects.equals(existing.getGuestPhone(), request.getEffectiveContactPhone()))) {
                    throw new OrderApiException(org.springframework.http.HttpStatus.CONFLICT,
                            "IDEMPOTENCY_KEY_REUSED", "This idempotency key belongs to a different order");
                }
                if (existing.getRequestFingerprint() != null
                        && !existing.getRequestFingerprint().equals(requestFingerprint)) {
                    throw new OrderApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED",
                            "This idempotency key was used for a different order request");
                }
                if (existing.getCustomerId() == null && !guestTokenService.matches(existing, existingGuestToken)) {
                    throw new OrderApiException(HttpStatus.FORBIDDEN, "INVALID_GUEST_TOKEN",
                            "A valid guest token is required to retrieve this guest order");
                }
                OrderResponseDto duplicate = toOrderResponseDto(existing);
                if (existing.getCustomerId() == null && existing.getGuestAccessNonce() != null) {
                    duplicate.setGuestToken(guestTokenService.tokenFor(existing));
                }
                return duplicate;
            }
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

        if (request.getItems().size() > MAX_DISTINCT_ITEMS) {
            throw new IllegalArgumentException("Order cannot contain more than " + MAX_DISTINCT_ITEMS + " distinct items");
        }
        long distinctItems = request.getItems().stream().map(OrderItemRequestDto::getMenuItemId).distinct().count();
        if (distinctItems != request.getItems().size()) {
            throw new IllegalArgumentException("Each menu item may appear only once in an order");
        }

        Order order = new Order();
        order.setCustomerId(request.getCustomerId());
        if (request.getCustomerId() == null) {
            order.setGuestAccessNonce(guestTokenService.newNonce());
        }
        order.setContactName(contactName);
        order.setContactPhone(contactPhone);
        order.setGuestName(contactName);
        order.setGuestPhone(contactPhone);
        order.setGuestEmail(request.getGuestEmail() != null ? request.getGuestEmail().trim() : null);
        order.setBranchId(branchId);
        order.setBranchNameSnapshot(branchLookupService.getBranchName(branchId));
        order.setBranchAddressSnapshot(branchLookupService.getBranchAddress(branchId));
        order.setFulfillmentType(request.getFulfillmentType());
        order.setDeliveryAddress(request.getDeliveryAddress() != null ? request.getDeliveryAddress().trim() : null);
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().trim().isEmpty()) {
            order.setIdempotencyKey(request.getIdempotencyKey().trim());
        }
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setRequestFingerprint(requestFingerprint);

        BigDecimal subtotal = BigDecimal.ZERO;
        List<OrderLine> lines = request.getItems().stream()
                .map(item -> new OrderLine(item.getMenuItemId(), item.getQuantity() == null ? 0 : item.getQuantity()))
                .toList();

        for (OrderItemRequestDto itemReq : request.getItems()) {
            if (itemReq.getMenuItemId() == null) {
                throw new IllegalArgumentException("menuItemId is required for each order item");
            }
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new IllegalArgumentException("Item quantity must be greater than zero");
            }
            if (itemReq.getQuantity() > MAX_ITEM_QUANTITY) {
                throw new IllegalArgumentException("Quantity for item " + itemReq.getMenuItemId() + " cannot exceed " + MAX_ITEM_QUANTITY);
            }

            MenuLookupService.MenuItemInfo itemInfo = menuLookupService.getItem(itemReq.getMenuItemId());
            if (itemInfo == null || !menuLookupService.isAvailable(itemReq.getMenuItemId())) {
                throw new IllegalArgumentException("Menu item " + itemReq.getMenuItemId() + " is not available");
            }

            if (!Objects.equals(itemInfo.branchId(), branchId)) {
                throw new IllegalArgumentException("Menu item " + itemReq.getMenuItemId() +
                        " belongs to branch " + itemInfo.branchId() + ", not order branch " + branchId);
            }

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

        if (subtotal.compareTo(minimumOrderSubtotal) < 0) {
            throw new IllegalArgumentException("Minimum order subtotal is LKR " + minimumOrderSubtotal.setScale(2, RoundingMode.HALF_UP) +
                    ". Your current subtotal is LKR " + subtotal.setScale(2, RoundingMode.HALF_UP));
        }
        if (!inventoryService.canReserve(branchId, lines)) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "ITEM_OUT_OF_STOCK", "One or more items are out of stock");
        }

        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));

        BigDecimal deliveryFee = (request.getFulfillmentType() == FulfillmentType.DELIVERY)
                ? flatDeliveryFee.setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        order.setDeliveryFee(deliveryFee);

        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        order.setTaxAmount(taxAmount);

        BigDecimal discountAmount = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (request.getPromoCode() != null && !request.getPromoCode().trim().isEmpty()) {
            String promo = request.getPromoCode().trim().toUpperCase();
            try {
                discountAmount = promotionService.calculateDiscount(promo, subtotal).setScale(2, RoundingMode.HALF_UP);
            } catch (IllegalArgumentException ex) {
                throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_PROMO", ex.getMessage());
            }
            if (discountAmount.signum() < 0 || discountAmount.compareTo(subtotal) > 0) {
                throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_PROMO",
                        "Promotion discount is outside the order subtotal");
            }
            order.setPromoCode(promo);
        }
        order.setDiscountAmount(discountAmount);

        BigDecimal grandTotal = subtotal.add(deliveryFee).add(taxAmount).subtract(discountAmount);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) {
            grandTotal = BigDecimal.ZERO;
        }
        order.setGrandTotal(grandTotal.setScale(2, RoundingMode.HALF_UP));

        Order saved = orderRepository.save(order);
        if (saved.getId() != null) {
            inventoryService.reserve(saved.getId(), branchId, lines);
            historyRepository.save(new OrderStatusHistory(saved.getId(), null, OrderStatus.PLACED,
                    saved.getCustomerId(), saved.getCustomerId() == null ? "GUEST" : "CUSTOMER", "Order placed"));
            eventPublisher.publishEvent(new OrderEvents.Placed(saved.getId(), branchId, lines,
                    saved.getPromoCode(), saved.getCustomerId()));
        }

        if (request.isSaveAddress() && request.getCustomerId() != null && request.getDeliveryAddress() != null && !request.getDeliveryAddress().trim().isEmpty()) {
            String addr = request.getDeliveryAddress().trim();
            if (savedAddressRepository != null && !savedAddressRepository.existsByCustomerIdAndAddressLine(request.getCustomerId(), addr)) {
                savedAddressRepository.save(new SavedAddress(request.getCustomerId(), addr, request.getCity()));
            }
        }

        OrderResponseDto response = toOrderResponseDto(saved);
        if (saved.getCustomerId() == null && saved.getGuestAccessNonce() != null && saved.getId() != null) {
            response.setGuestToken(guestTokenService.tokenFor(saved));
        }
        return response;
    }

    @Transactional(readOnly = true)
    OrderResponseDto getOrderById(Long id) {
        Order order = findOrderOrThrow(id);
        return toOrderResponseDto(order);
    }

    @Transactional(readOnly = true)
    List<OrderResponseDto> getOrders(Long customerId, Long branchId, OrderStatus status) {
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

        Map<Long, User> riders = new HashMap<>();
        return orders.stream().map(order -> toOrderResponseDto(order, riders)).toList();
    }

    // ------------------------------------------------------------------ staff pipeline

    public OrderResponseDto updateOrderStatus(Long id, OrderStatus newStatus, User actor, Long riderId, String note) {
        if (newStatus == null) {
            throw new OrderApiException(HttpStatus.BAD_REQUEST, "STATUS_REQUIRED", "A target status is required");
        }
        if (note != null && note.length() > 255) {
            throw new OrderApiException(HttpStatus.BAD_REQUEST, "NOTE_TOO_LONG", "Status note is too long");
        }
        Order order = findOrderOrThrow(id);
        boolean accepting = order.isAwaitingAcceptance();
        transitionGuard.checkStaff(order, newStatus, actor);
        if (accepting) {
            order.setAcceptedAt(LocalDateTime.now());
            order.setAcceptedBy(actor.getId());
        }
        if (newStatus == OrderStatus.OUT_FOR_DELIVERY) {
            if (riderId == null) {
                throw new OrderApiException(HttpStatus.BAD_REQUEST, "RIDER_REQUIRED", "Choose a rider before dispatch");
            }
            User rider = userRepository.findById(riderId).orElseThrow(() ->
                    new OrderApiException(HttpStatus.BAD_REQUEST, "RIDER_NOT_FOUND", "Selected rider does not exist"));
            if (rider.getRole() != Role.DELIVERY_PARTNER || rider.getStatus() != UserStatus.APPROVED
                    || !Objects.equals(rider.getBranchId(), order.getBranchId())) {
                throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "RIDER_NOT_ELIGIBLE",
                        "Choose an approved delivery partner from this branch");
            }
            order.setRiderId(riderId);
            order.setDispatchedAt(LocalDateTime.now());
        }
        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
        }
        OrderResponseDto result = transition(order, newStatus, actor.getId(), actor.getRole().name(), note);
        if (accepting) {
            eventPublisher.publishEvent(new OrderEvents.Accepted(order.getId(), order.getBranchId(), actor.getId()));
        }
        return result;
    }

    private OrderResponseDto transition(Order order, OrderStatus target, Long actorId, String actorRole, String note) {
        OrderStatus previous = order.getStatus();
        order.setStatus(target);
        Order saved = orderRepository.save(order);
        historyRepository.save(new OrderStatusHistory(saved.getId(), previous, target, actorId, actorRole, note));
        switch (target) {
            case PREPARING -> eventPublisher.publishEvent(new OrderEvents.PreparingStarted(saved.getId()));
            case OUT_FOR_DELIVERY -> eventPublisher.publishEvent(new OrderEvents.Dispatched(saved.getId(), saved.getRiderId()));
            case DELIVERED -> eventPublisher.publishEvent(new OrderEvents.Delivered(saved.getId()));
            case CANCELLED -> eventPublisher.publishEvent(new OrderEvents.Cancelled(saved.getId(), saved.getCancellationReason()));
            case DELIVERY_FAILED -> eventPublisher.publishEvent(new OrderEvents.DeliveryFailed(saved.getId(), saved.getFailureReason()));
            case COMPLETED -> eventPublisher.publishEvent(new OrderEvents.Completed(saved.getId()));
            default -> { }
        }
        return toOrderResponseDto(saved);
    }

    /** Customer/guest, branch staff or the admin cancel. Customers may only cancel before the branch accepts. */
    OrderResponseDto cancelOrder(Long id, User actor, String reason) {
        if (reason != null && reason.length() > 255) {
            throw new OrderApiException(HttpStatus.BAD_REQUEST, "REASON_TOO_LONG", "Cancellation reason is too long");
        }
        Order order = findOrderOrThrow(id);
        Role role = actor == null ? null : actor.getRole();
        boolean branchSide = role == Role.STAFF || role == Role.SUPER_ADMIN;
        if (role == Role.DELIVERY_PARTNER || role == Role.BRANCH_MANAGER) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "CANCELLATION_FORBIDDEN",
                    "Only the customer, branch staff or the admin can cancel orders");
        }
        if (!branchSide && CANCEL_REQUESTABLE.contains(order.getStatus())) {
            throw new OrderApiException(HttpStatus.CONFLICT, "CANCEL_REQUEST_REQUIRED",
                    "The branch has already accepted this order. Send a cancellation request instead.");
        }
        Set<OrderStatus> allowed = branchSide ? STAFF_CANCELLABLE : CUSTOMER_CANCELLABLE;
        if (!allowed.contains(order.getStatus())) {
            throw new OrderApiException(HttpStatus.CONFLICT, "CANCELLATION_LOCKED",
                    "Order can no longer be cancelled");
        }
        String cancelReason = role == null || role == Role.CUSTOMER ? "CUSTOMER"
                : role == Role.STAFF ? "BRANCH" : "ADMIN";
        return cancelWithRefund(order, cancelReason, actor, reason);
    }

    OrderResponseDto rejectOrder(Long id, User actor, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new OrderApiException(HttpStatus.BAD_REQUEST, "REASON_REQUIRED", "Tell the customer why the order was rejected");
        }
        Order order = findOrderOrThrow(id);
        transitionGuard.checkStaffActor(order, actor);
        if (!order.isAwaitingAcceptance()) {
            throw new OrderApiException(HttpStatus.CONFLICT, "NOT_AWAITING_ACCEPTANCE",
                    "Only orders waiting for acceptance can be rejected");
        }
        return cancelWithRefund(order, "REJECTED_BY_BRANCH", actor, "Rejected: " + reason.trim());
    }

    OrderResponseDto requestCancellation(Long id, User actor, String reason) {
        if (reason == null || reason.isBlank() || reason.length() > 255) {
            throw new OrderApiException(HttpStatus.BAD_REQUEST, "REASON_REQUIRED", "Give a short reason for cancelling");
        }
        Order order = findOrderOrThrow(id);
        if (!CANCEL_REQUESTABLE.contains(order.getStatus())) {
            throw new OrderApiException(HttpStatus.CONFLICT, "CANCEL_REQUEST_NOT_ALLOWED",
                    CUSTOMER_CANCELLABLE.contains(order.getStatus())
                            ? "This order can be cancelled directly"
                            : "This order can no longer be cancelled");
        }
        if (order.getCancelRequestStatus() != null) {
            throw new OrderApiException(HttpStatus.CONFLICT, "CANCEL_REQUEST_EXISTS",
                    order.getCancelRequestStatus() == CancelRequestStatus.PENDING
                            ? "A cancellation request is already waiting for the branch"
                            : "A cancellation request for this order was already decided");
        }
        order.setCancelRequestStatus(CancelRequestStatus.PENDING);
        order.setCancelRequestReason(reason.trim());
        order.setCancelRequestedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        historyRepository.save(new OrderStatusHistory(saved.getId(), saved.getStatus(), saved.getStatus(),
                actor != null ? actor.getId() : null, actor != null ? actor.getRole().name() : "GUEST",
                "Cancellation requested: " + reason.trim()));
        eventPublisher.publishEvent(new OrderEvents.CancelRequested(saved.getId(), saved.getBranchId(), reason.trim()));
        return toOrderResponseDto(saved);
    }

    OrderResponseDto resolveCancellation(Long id, User actor, boolean approve, String note) {
        Order order = findOrderOrThrow(id);
        transitionGuard.checkStaffActor(order, actor);
        if (order.getCancelRequestStatus() != CancelRequestStatus.PENDING) {
            throw new OrderApiException(HttpStatus.CONFLICT, "NO_PENDING_CANCEL_REQUEST",
                    "There is no pending cancellation request for this order");
        }
        String trimmedNote = note == null || note.isBlank() ? null : note.trim();
        order.setCancelRequestNote(trimmedNote);
        if (approve) {
            order.setCancelRequestStatus(CancelRequestStatus.APPROVED);
            return cancelWithRefund(order, "CUSTOMER_REQUEST", actor,
                    "Cancellation request approved" + (trimmedNote != null ? ": " + trimmedNote : ""));
        }
        order.setCancelRequestStatus(CancelRequestStatus.DECLINED);
        Order saved = orderRepository.save(order);
        historyRepository.save(new OrderStatusHistory(saved.getId(), saved.getStatus(), saved.getStatus(),
                actor.getId(), actor.getRole().name(),
                "Cancellation request declined" + (trimmedNote != null ? ": " + trimmedNote : "")));
        return toOrderResponseDto(saved);
    }

    private OrderResponseDto cancelWithRefund(Order order, String cancelReason, User actor, String note) {
        order.setCancellationReason(cancelReason);
        if (order.getPaymentStatus() == PaymentStatus.VERIFIED) {
            order.setPaymentStatus(PaymentStatus.REFUND_PENDING);
            order.setRefundStatus(RefundStatus.PENDING);
            attemptRefund(order);
        } else {
            order.setPaymentStatus(PaymentStatus.VOIDED);
        }
        return transition(order, OrderStatus.CANCELLED, actor != null ? actor.getId() : null,
                actor != null ? actor.getRole().name() : (cancelReason.equals("CUSTOMER") ? "GUEST" : "SYSTEM"), note);
    }

    /** One refund call to the gateway; leaves the order REFUND_PENDING when the gateway fails. */
    private boolean attemptRefund(Order order) {
        order.setRefundAttempts(order.getRefundAttempts() + 1);
        order.setLastRefundAttemptAt(LocalDateTime.now());
        RefundGateway.RefundResult refund;
        try {
            refund = refundGateway.refund(order.getPaymentReference(), order.getGrandTotal());
        } catch (RuntimeException ex) {
            log.warn("Refund gateway error for order {}: {}", order.getId(), ex.getMessage());
            return false;
        }
        if (refund != null && refund.refunded()) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
            order.setRefundStatus(RefundStatus.PROCESSED);
            order.setRefundedAmount(order.getGrandTotal());
            order.setRefundReference(refund.reference());
            return true;
        }
        return false;
    }

    OrderResponseDto retryRefund(Long id, User actor) {
        Order order = findOrderOrThrow(id);
        if (order.getRefundStatus() != RefundStatus.PENDING) {
            throw new OrderApiException(HttpStatus.CONFLICT, "NO_PENDING_REFUND", "This order has no pending refund");
        }
        boolean refunded = attemptRefund(order);
        Order saved = orderRepository.save(order);
        historyRepository.save(new OrderStatusHistory(saved.getId(), saved.getStatus(), saved.getStatus(),
                actor != null ? actor.getId() : null, actor != null ? actor.getRole().name() : "SYSTEM",
                refunded ? "Refund processed" : "Refund attempt failed"));
        if (!refunded) {
            throw new OrderApiException(HttpStatus.BAD_GATEWAY, "REFUND_FAILED",
                    "The payment provider did not accept the refund. Try again shortly.");
        }
        return toOrderResponseDto(saved);
    }

    OrderResponseDto updateOrderItem(Long orderId, Long itemId, Integer newQuantity) {
        Order order = findOrderOrThrow(orderId);
        OrderStatus current = order.getStatus();

        if (current != OrderStatus.PLACED || order.getPaymentMethod() != null) {
            throw new OrderApiException(HttpStatus.CONFLICT, "ORDER_ITEMS_LOCKED",
                    "Order items can only be edited before payment is selected");
        }

        if (newQuantity == null || newQuantity < 0) {
            throw new IllegalArgumentException("Quantity must be greater than or equal to 0");
        }

        if (newQuantity > MAX_ITEM_QUANTITY) {
            throw new IllegalArgumentException("Quantity cannot exceed maximum limit of " + MAX_ITEM_QUANTITY);
        }

        OrderItem targetItem = order.getItems().stream()
                .filter(item -> Objects.equals(item.getId(), itemId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Order item " + itemId + " not found in order " + orderId));

        int previousQuantity = targetItem.getQuantity();
        if (newQuantity > previousQuantity && !inventoryService.canReserve(order.getBranchId(),
                List.of(new OrderLine(targetItem.getMenuItemId(), newQuantity - previousQuantity)))) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "ITEM_OUT_OF_STOCK",
                    "Requested additional quantity is out of stock");
        }

        if (newQuantity == 0) {
            if (order.getItems().size() <= 1) {
                throw new IllegalStateException("Cannot remove the only remaining item from the order. To cancel the order, please use the cancel endpoint.");
            }
            order.getItems().remove(targetItem);
        } else {
            targetItem.setQuantity(newQuantity);
            targetItem.setLineTotal(targetItem.getUnitPriceSnapshot()
                    .multiply(BigDecimal.valueOf(newQuantity))
                    .setScale(2, RoundingMode.HALF_UP));
        }

        // Recalculate subtotal
        BigDecimal subtotal = order.getItems().stream()
                .map(OrderItem::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        if (subtotal.compareTo(minimumOrderSubtotal) < 0) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "MINIMUM_SUBTOTAL",
                    "Order subtotal must remain at least LKR " + minimumOrderSubtotal);
        }
        order.setSubtotal(subtotal);

        // Recalculate 5% tax
        BigDecimal taxAmount = subtotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        order.setTaxAmount(taxAmount);

        BigDecimal discount = order.getPromoCode() == null ? BigDecimal.ZERO :
                promotionService.calculateDiscount(order.getPromoCode(), subtotal);
        if (discount == null) discount = BigDecimal.ZERO;
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        order.setDiscountAmount(discount);

        // Grand Total = subtotal + deliveryFee + taxAmount - discountAmount
        BigDecimal grandTotal = subtotal.add(order.getDeliveryFee()).add(taxAmount).subtract(discount).setScale(2, RoundingMode.HALF_UP);
        order.setGrandTotal(grandTotal);

        Order updated = orderRepository.save(order);
        inventoryService.reserve(updated.getId(), updated.getBranchId(), updated.getItems().stream()
                .map(item -> new OrderLine(item.getMenuItemId(), item.getQuantity())).toList());
        return toOrderResponseDto(updated);
    }

    @Transactional(readOnly = true)
    BillDto getOrderBill(Long id) {
        Order order = findOrderOrThrow(id);

        BillDto bill = new BillDto();
        bill.setOrderId(order.getId());
        bill.setCustomerId(order.getCustomerId());
        bill.setCustomerOrGuestName(order.getContactName() != null ? order.getContactName() : order.getGuestName());
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
        bill.setTaxRatePercent(taxRate.multiply(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP));
        bill.setTaxAmount(order.getTaxAmount());
        bill.setPromoCode(order.getPromoCode());
        bill.setDiscountAmount(order.getDiscountAmount());
        bill.setGrandTotal(order.getGrandTotal());
        bill.setPaymentStatus(order.getPaymentStatus());
        bill.setPaymentMethod(order.getPaymentMethod());
        bill.setCashCollected(order.getCashCollected());
        bill.setChangeGiven(order.getChangeGiven());
        bill.setRefundedAmount(order.getRefundedAmount());
        bill.setCancellationReason(order.getCancellationReason());
        bill.setFailureReason(order.getFailureReason());
        bill.setOrderStatus(order.getStatus());
        bill.setCreatedAt(order.getCreatedAt());

        return bill;
    }

    // ------------------------------------------------------------------ payment

    OrderResponseDto recordPayment(Long id, PaymentRequestDto request) {
        return recordPayment(id, request, UUID.randomUUID().toString()).order();
    }

    public record PaymentResult(int httpStatus, OrderResponseDto order, String declineCode, String declineMessage) {
        public PaymentResult(int httpStatus, OrderResponseDto order) {
            this(httpStatus, order, null, null);
        }
    }

    PaymentResult recordPayment(Long id, PaymentRequestDto request, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 100) {
            throw new OrderApiException(HttpStatus.BAD_REQUEST, "IDEMPOTENCY_KEY_REQUIRED",
                    "Send a valid Idempotency-Key header for each payment attempt");
        }
        Order order = orderRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new OrderApiException(HttpStatus.NOT_FOUND,
                        "ORDER_NOT_FOUND", "Order with id " + id + " not found"));
        PaymentMethod method = request != null && request.getPaymentMethod() != null
                ? request.getPaymentMethod() : PaymentMethod.CREDIT_CARD;
        if (method == PaymentMethod.CARD_STRIPE) {
            method = PaymentMethod.CREDIT_CARD;
        }
        String key = idempotencyKey.trim();
        PaymentGateway.CardDetails card = method == PaymentMethod.CASH_ON_DELIVERY ? null : toCard(request);
        String fingerprint = paymentFingerprint(id, method, card, order.getGrandTotal());
        Optional<PaymentAttempt> duplicate = paymentAttemptRepository.findByIdempotencyKey(key);
        if (duplicate.isPresent()) {
            PaymentAttempt attempt = duplicate.get();
            if (!Objects.equals(attempt.getOrderId(), id) || !Objects.equals(attempt.getRequestFingerprint(), fingerprint)) {
                throw new OrderApiException(HttpStatus.CONFLICT, "IDEMPOTENCY_KEY_REUSED",
                        "This payment key was used with a different request");
            }
            OrderResponseDto firstResult = attempt.getResponseJson() != null
                    ? json.readValue(attempt.getResponseJson(), OrderResponseDto.class)
                    : toOrderResponseDto(order);
            firstResult.setStatus(attempt.getOrderStatus());
            firstResult.setPaymentStatus(attempt.getPaymentStatus());
            firstResult.setPaymentReference(attempt.getGatewayReference());
            return new PaymentResult(attempt.getHttpStatus(), firstResult);
        }

        transitionGuard.checkPayment(order, method);
        if (method == PaymentMethod.CASH_ON_DELIVERY) {
            codEligibilityService.requireEligible(order);
            order.setPaymentMethod(method);
            order.setPaymentStatus(PaymentStatus.PENDING);
            order.setPaymentIdempotencyKey(key);
            order.setAwaitingAcceptanceSince(LocalDateTime.now());
            Order saved = orderRepository.save(order);
            historyRepository.save(new OrderStatusHistory(saved.getId(), OrderStatus.PLACED, OrderStatus.PLACED,
                    null, "SYSTEM", "Cash on delivery selected; waiting for the branch to accept"));
            OrderResponseDto pending = toOrderResponseDto(saved);
            savePaymentAttempt(id, key, method, fingerprint, 200, pending, null);
            return new PaymentResult(200, pending);
        }

        String problem = CardValidator.problemWith(card, YearMonth.now());
        if (problem != null) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_CARD_DETAILS", problem);
        }

        order.setPaymentMethod(method);
        order.setPaymentIdempotencyKey(key);
        PaymentGateway.GatewayResult gatewayResult = paymentGateway.charge(order.getGrandTotal(), card, key);
        order.setCardBrand(gatewayResult.brand());
        order.setCardLast4(gatewayResult.last4());
        if (gatewayResult.approved()) {
            order.setPaymentStatus(PaymentStatus.VERIFIED);
            order.setPaymentReference(gatewayResult.reference());
            order.setAwaitingAcceptanceSince(LocalDateTime.now());
            OrderResponseDto paid = transition(order, OrderStatus.PAYMENT_VERIFIED, null, "SYSTEM",
                    "Card payment verified (" + gatewayResult.brand() + " **** " + gatewayResult.last4() + ")");
            savePaymentAttempt(id, key, method, fingerprint, 200, paid, gatewayResult.reference());
            return new PaymentResult(200, paid);
        }

        order.setPaymentStatus(PaymentStatus.FAILED);
        order.setPaymentAttempts(order.getPaymentAttempts() + 1);
        OrderResponseDto failed;
        if (order.getPaymentAttempts() >= maxCardAttempts) {
            order.setCancellationReason("PAYMENT_FAILED");
            order.setPaymentStatus(PaymentStatus.VOIDED);
            failed = transition(order, OrderStatus.CANCELLED, null, "SYSTEM",
                    "Card declined " + maxCardAttempts + " times");
        } else {
            failed = toOrderResponseDto(orderRepository.save(order));
        }
        savePaymentAttempt(id, key, method, fingerprint, 402, failed, null);
        return new PaymentResult(402, failed, gatewayResult.declineCode(), gatewayResult.message());
    }

    public int getMaxCardAttempts() {
        return maxCardAttempts;
    }

    private PaymentGateway.CardDetails toCard(PaymentRequestDto request) {
        PaymentRequestDto.CardDto card = request != null ? request.getCard() : null;
        if (card == null) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_CARD_DETAILS", "Card details are required");
        }
        return new PaymentGateway.CardDetails(
                card.holderName() != null ? card.holderName().trim() : null,
                CardValidator.normalizeNumber(card.number()),
                card.expMonth() != null ? card.expMonth() : 0,
                card.expYear() != null ? card.expYear() : 0,
                card.cvc() != null ? card.cvc().trim() : null);
    }

    private void savePaymentAttempt(Long id, String key, PaymentMethod method, String fingerprint,
                                    int httpStatus, OrderResponseDto response, String gatewayReference) {
        PaymentAttempt attempt = new PaymentAttempt(id, key, method, fingerprint, httpStatus,
                response.getPaymentStatus(), response.getStatus(), gatewayReference);
        attempt.setResponseJson(json.writeValueAsString(response));
        paymentAttemptRepository.save(attempt);
    }

    /** Identifies a payment request without storing card data: only the last four digits and expiry are hashed. */
    private String paymentFingerprint(Long id, PaymentMethod method, PaymentGateway.CardDetails card, BigDecimal amount) {
        String cardPart = card == null ? "-" : card.last4() + "/" + card.expMonth() + "/" + card.expYear();
        try {
            byte[] data = (id + ":" + method + ":" + cardPart + ":" + amount).getBytes(StandardCharsets.UTF_8);
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(data);
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private String creationFingerprint(OrderRequestDto request) {
        String lines = request.getItems() == null ? "null" : request.getItems().stream()
                .map(item -> item.getMenuItemId() + "x" + item.getQuantity())
                .sorted().collect(java.util.stream.Collectors.joining(","));
        String payload = request.getCustomerId() + "|" + request.getEffectiveContactName() + "|"
                + request.getEffectiveContactPhone() + "|" + request.getBranchId() + "|"
                + request.getFulfillmentType() + "|" + request.getDeliveryAddress() + "|"
                + request.getPromoCode() + "|" + lines;
        try {
            return java.util.HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    @Transactional(readOnly = true)
    PaymentOptionsDto getPaymentOptions(Long id) {
        Order order = findOrderOrThrow(id);
        CodEligibilityService.Eligibility cod = codEligibilityService.evaluate(order);
        return new PaymentOptionsDto(List.of(PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD,
                PaymentMethod.CASH_ON_DELIVERY), cod.eligible(), cod.code(), cod.message());
    }

    // ------------------------------------------------------------------ hand-over

    public OrderResponseDto collectCod(Long id, BigDecimal cashCollected, User actor) {
        Order order = findOrderOrThrow(id);
        transitionGuard.checkStaffActor(order, actor);
        if (order.getFulfillmentType() == FulfillmentType.TAKEAWAY && actor.getRole() != Role.STAFF) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "STAFF_REQUIRED", "Counter cash must be recorded by branch staff");
        }
        transitionGuard.checkCodCollect(order);
        if (cashCollected == null || cashCollected.compareTo(order.getGrandTotal()) < 0) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_CASH",
                    "Cash received must cover the order total");
        }
        BigDecimal cash = cashCollected.setScale(2, RoundingMode.HALF_UP);
        order.setCashCollected(cash);
        order.setChangeGiven(cash.subtract(order.getGrandTotal()).setScale(2, RoundingMode.HALF_UP));
        order.setPaymentStatus(PaymentStatus.VERIFIED);
        OrderStatus target = order.getFulfillmentType() == FulfillmentType.DELIVERY
                ? OrderStatus.DELIVERED : OrderStatus.COMPLETED;
        if (target == OrderStatus.DELIVERED) order.setDeliveredAt(LocalDateTime.now());
        return transition(order, target, actor.getId(), actor.getRole().name(), "Cash collected");
    }

    public OrderResponseDto markDeliveryFailed(Long id, String reason, User actor) {
        Order order = findOrderOrThrow(id);
        transitionGuard.checkStaffActor(order, actor);
        if (order.getStatus() != OrderStatus.OUT_FOR_DELIVERY) {
            throw new OrderApiException(HttpStatus.CONFLICT, "INVALID_TRANSITION",
                    "Only an order out for delivery can be marked failed");
        }
        if (!Set.of("CUSTOMER_UNREACHABLE", "REFUSED", "WRONG_ADDRESS").contains(reason)) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_FAILURE_REASON",
                    "Choose a valid delivery failure reason");
        }
        order.setFailureReason(reason);
        if (order.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
            order.setPaymentStatus(PaymentStatus.FAILED);
        }
        return transition(order, OrderStatus.DELIVERY_FAILED, actor.getId(), actor.getRole().name(), reason);
    }

    @Transactional(readOnly = true)
    List<OrderStatusHistory> getStatusHistory(Long id) {
        findOrderOrThrow(id);
        return historyRepository.findByOrderIdOrderByChangedAtAscIdAsc(id);
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new OrderApiException(HttpStatus.NOT_FOUND,
                        "ORDER_NOT_FOUND", "Order with id " + id + " not found"));
    }

    // ------------------------------------------------------------------ addresses and claims

    @Transactional(readOnly = true)
    List<SavedAddress> getSavedAddresses(Long customerId) {
        if (customerId == null || savedAddressRepository == null) return List.of();
        return savedAddressRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }

    SavedAddress saveAddress(Long customerId, String addressLine, String city) {
        if (customerId == null || addressLine == null || addressLine.trim().isEmpty()) {
            throw new IllegalArgumentException("Customer ID and address line are required");
        }
        return savedAddressRepository.save(new SavedAddress(customerId, addressLine.trim(), city));
    }

    ClaimOrdersResponseDto claimGuestOrder(Long orderId, Long customerId) {
        if (customerId == null) {
            throw new IllegalArgumentException("Customer ID is required to claim an order");
        }
        Order order = findOrderOrThrow(orderId);
        if (order.getCustomerId() != null) {
            throw new OrderApiException(org.springframework.http.HttpStatus.CONFLICT,
                    "ALREADY_CLAIMED", "This order is already linked to an account");
        }
        order.setCustomerId(customerId);
        order.setGuestAccessNonce(null);
        orderRepository.save(order);
        return new ClaimOrdersResponseDto(1, List.of(orderId), "Order linked to your account");
    }

    // ------------------------------------------------------------------ scheduled housekeeping

    @Transactional
    public int autoCancelAbandonedOrders(int timeoutMinutes) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(timeoutMinutes);
        List<Order> abandoned = orderRepository.findAbandonedCardOrders(OrderStatus.PLACED,
                List.of(PaymentStatus.PENDING, PaymentStatus.FAILED), PaymentMethod.CASH_ON_DELIVERY, cutoff);

        for (Order order : abandoned) {
            order.setPaymentStatus(PaymentStatus.VOIDED);
            order.setCancellationReason("TIMEOUT");
            transition(order, OrderStatus.CANCELLED, null, "SYSTEM", "Payment timeout");
        }

        return abandoned.size();
    }

    /** Orders the branch never accepted are rejected automatically and refunded if they were paid. */
    @Transactional
    public int autoRejectUnacceptedOrders(int timeoutMinutes) {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(timeoutMinutes);
        List<Order> stale = orderRepository.findUnacceptedSince(cutoff);
        for (Order order : stale) {
            cancelWithRefund(order, "NOT_ACCEPTED", null,
                    "Branch did not accept within " + timeoutMinutes + " minutes");
        }
        return stale.size();
    }

    @Transactional
    public int retryPendingRefunds() {
        int processed = 0;
        for (Order order : orderRepository.findByRefundStatus(RefundStatus.PENDING)) {
            if (order.getRefundAttempts() >= maxRefundAttempts) continue;
            if (attemptRefund(order)) processed++;
            orderRepository.save(order);
        }
        return processed;
    }

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void scheduleAutoCancelAbandonedOrders() {
        autoCancelAbandonedOrders(paymentTimeoutMinutes);
        autoRejectUnacceptedOrders(acceptanceTimeoutMinutes);
    }

    @Scheduled(fixedRate = 300000, initialDelay = 120000)
    @Transactional
    public void scheduleRefundRetries() {
        retryPendingRefunds();
    }

    // ------------------------------------------------------------------ mapping

    private OrderResponseDto toOrderResponseDto(Order order) {
        return toOrderResponseDto(order, new HashMap<>());
    }

    private OrderResponseDto toOrderResponseDto(Order order, Map<Long, User> riderCache) {
        OrderResponseDto dto = new OrderResponseDto();
        dto.setId(order.getId());
        dto.setCustomerId(order.getCustomerId());
        dto.setContactName(order.getContactName());
        dto.setContactPhone(order.getContactPhone());
        dto.setGuestName(order.getGuestName());
        dto.setGuestPhone(order.getGuestPhone());
        dto.setGuestEmail(order.getGuestEmail());
        dto.setBranchId(order.getBranchId());
        dto.setBranchNameSnapshot(order.getBranchNameSnapshot());
        dto.setBranchAddressSnapshot(order.getBranchAddressSnapshot());
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
        dto.setRefundStatus(order.getRefundStatus());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setIdempotencyKey(order.getIdempotencyKey());
        dto.setVersion(order.getVersion());
        dto.setCancellationReason(order.getCancellationReason());
        dto.setFailureReason(order.getFailureReason());
        dto.setPaymentReference(order.getPaymentReference());
        dto.setPaymentAttempts(order.getPaymentAttempts());
        dto.setCashCollected(order.getCashCollected());
        dto.setChangeGiven(order.getChangeGiven());
        dto.setRefundedAmount(order.getRefundedAmount());
        dto.setRiderId(order.getRiderId());
        dto.setDispatchedAt(order.getDispatchedAt());
        dto.setDeliveredAt(order.getDeliveredAt());
        dto.setCreatedAt(order.getCreatedAt());
        dto.setUpdatedAt(order.getUpdatedAt());
        dto.setAwaitingAcceptance(order.isAwaitingAcceptance());
        dto.setAwaitingAcceptanceSince(order.getAwaitingAcceptanceSince());
        dto.setAcceptedAt(order.getAcceptedAt());
        dto.setCancelRequestStatus(order.getCancelRequestStatus());
        dto.setCancelRequestReason(order.getCancelRequestReason());
        dto.setCancelRequestedAt(order.getCancelRequestedAt());
        dto.setCancelRequestNote(order.getCancelRequestNote());
        dto.setCardBrand(order.getCardBrand());
        dto.setCardLast4(order.getCardLast4());
        dto.setRefundAttempts(order.getRefundAttempts());
        if (order.getRiderId() != null && userRepository != null) {
            User rider = riderCache.computeIfAbsent(order.getRiderId(),
                    riderId -> userRepository.findById(riderId).orElse(null));
            if (rider != null) {
                dto.setRiderName(rider.getName());
                dto.setRiderPhone(rider.getPhoneNumber());
            }
        }

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
