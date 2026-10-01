package com.example.BigBite.order;

import com.example.BigBite.order.dto.BillDto;
import com.example.BigBite.order.dto.ClaimOrdersResponseDto;
import com.example.BigBite.order.dto.OrderRequestDto;
import com.example.BigBite.order.dto.OrderResponseDto;
import com.example.BigBite.order.dto.OrderStatusUpdateRequestDto;
import com.example.BigBite.order.dto.PaymentRequestDto;
import com.example.BigBite.order.dto.UpdateOrderItemRequestDto;
import com.example.BigBite.order.dto.PaymentOptionsDto;
import com.example.BigBite.order.dto.CodCollectRequestDto;
import com.example.BigBite.order.dto.DeliveryFailedRequestDto;
import com.example.BigBite.order.dto.CancelOrderRequestDto;
import jakarta.persistence.OptimisticLockException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.auth.dto.UserDto;
import com.example.BigBite.order.dto.PaymentIntentResponseDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;
    private final OrderRateLimiter orderRateLimiter;
    private final OrderAccessGuard accessGuard;

    public OrderController(OrderService orderService, UserRepository userRepository, OrderRateLimiter orderRateLimiter,
                           OrderAccessGuard accessGuard) {
        this.orderService = orderService;
        this.userRepository = userRepository;
        this.orderRateLimiter = orderRateLimiter;
        this.accessGuard = accessGuard;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null || userRepository == null) return null;
        return userRepository.findByEmail(userDetails.getUsername()).orElse(null);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    @PostMapping
    public ResponseEntity<OrderResponseDto> placeOrder(
            @Valid @RequestBody OrderRequestDto request,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest servletRequest) {
        User user = getAuthenticatedUser(userDetails);

        String clientIp = extractClientIp(servletRequest);
        String rateLimitKey = (user != null) ? "user:" + user.getId() : "ip:" + clientIp;
        if (orderRateLimiter != null && !orderRateLimiter.tryAcquire(rateLimitKey)) {
            throw new OrderRateLimitExceededException("Too many order requests. Please wait a moment before placing another order.");
        }
        if (user != null) {
            if (user.getRole() != Role.CUSTOMER) {
                throw new OrderApiException(HttpStatus.FORBIDDEN, "CUSTOMER_REQUIRED", "Only customers can place personal orders");
            }
            request.setCustomerId(user.getId());
            if (request.getContactName() == null || request.getContactName().isBlank()) {
                request.setContactName(user.getName());
            }
            if (request.getContactPhone() == null || request.getContactPhone().isBlank()) {
                request.setContactPhone(user.getPhoneNumber());
            }
        } else {
            request.setCustomerId(null);
        }

        OrderResponseDto response = orderService.placeOrderFor(request, user, guestToken);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> getOrder(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireView(id, user, guestToken);
        OrderResponseDto response = orderService.getOrderFor(id, user, guestToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDto>> getOrders(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) OrderStatus status,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null) {
            throw new OrderApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Authentication is required to list orders");
        }
        if (user.getRole() == Role.CUSTOMER) {
            customerId = user.getId();
            branchId = null;
        } else if (user.getRole() == Role.BRANCH_MANAGER || user.getRole() == Role.DELIVERY_PARTNER) {
            customerId = null;
            if (branchId == null) branchId = user.getBranchId();
        }
        accessGuard.requireList(user, customerId, branchId);
        List<OrderResponseDto> orders = orderService.getOrdersFor(customerId, branchId, status, user);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/riders")
    public ResponseEntity<List<UserDto>> getBranchRiders(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null || user.getRole() != Role.BRANCH_MANAGER || user.getBranchId() == null) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "MANAGER_REQUIRED",
                    "An assigned branch manager is required to choose a rider");
        }
        accessGuard.requireUsableAccount(user);
        return ResponseEntity.ok(userRepository.findByRoleAndBranchIdAndStatus(
                Role.DELIVERY_PARTNER, user.getBranchId(), UserStatus.APPROVED).stream()
                .map(UserDto::fromEntity).toList());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponseDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireStaffAction(id, user);
        OrderResponseDto updated = orderService.updateOrderStatus(id, request.getStatus(), user,
                request.getRiderId(), request.getNote());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponseDto> cancelOrder(
            @PathVariable Long id,
            @RequestBody(required = false) CancelOrderRequestDto request,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireCancel(id, user, guestToken);
        OrderResponseDto cancelled = orderService.cancelOrderFor(id, user, guestToken,
                request != null ? request.reason() : null);
        return ResponseEntity.ok(cancelled);
    }

    @PatchMapping("/{id}/items/{itemId}")
    public ResponseEntity<OrderResponseDto> updateOrderItem(
            @PathVariable Long id,
            @PathVariable Long itemId,
            @Valid @RequestBody UpdateOrderItemRequestDto request,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireCustomerAction(id, user, guestToken);
        OrderResponseDto updated = orderService.updateOrderItemFor(id, itemId, request.getQuantity(), user, guestToken);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}/bill")
    public ResponseEntity<BillDto> getBill(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireView(id, user, guestToken);
        BillDto bill = orderService.getBillFor(id, user, guestToken);
        return ResponseEntity.ok(bill);
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<?> recordPayment(
            @PathVariable Long id,
            @RequestBody PaymentRequestDto request,
            @RequestHeader(name = "Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireCustomerAction(id, user, guestToken);
        OrderService.PaymentResult result = orderService.recordPaymentFor(id, request, idempotencyKey, user, guestToken);
        if (result.httpStatus() == 402) {
            return ResponseEntity.status(402).body(Map.of(
                    "error", result.order().getStatus() == OrderStatus.CANCELLED ? "PAYMENT_FAILED" : "PAYMENT_DECLINED",
                    "message", result.order().getStatus() == OrderStatus.CANCELLED
                            ? "Card payment declined three times; the order was cancelled"
                            : "Card payment declined; try another card",
                    "order", result.order()));
        }
        return ResponseEntity.status(result.httpStatus()).body(result.order());
    }

    @GetMapping("/{id}/payment-options")
    public ResponseEntity<PaymentOptionsDto> getPaymentOptions(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        accessGuard.requireCustomerAction(id, getAuthenticatedUser(userDetails), guestToken);
        return ResponseEntity.ok(orderService.getPaymentOptionsFor(id, getAuthenticatedUser(userDetails), guestToken));
    }

    @PostMapping("/{id}/cod/collect")
    public ResponseEntity<OrderResponseDto> collectCod(
            @PathVariable Long id,
            @Valid @RequestBody CodCollectRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireStaffAction(id, user);
        return ResponseEntity.ok(orderService.collectCod(id, request.cashCollected(), user));
    }

    @PostMapping("/{id}/delivery-failed")
    public ResponseEntity<OrderResponseDto> markDeliveryFailed(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryFailedRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireStaffAction(id, user);
        return ResponseEntity.ok(orderService.markDeliveryFailed(id, request.reason(), user));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OrderStatusHistory>> getStatusHistory(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        accessGuard.requireView(id, getAuthenticatedUser(userDetails), guestToken);
        return ResponseEntity.ok(orderService.getHistoryFor(id, getAuthenticatedUser(userDetails), guestToken));
    }

    @PostMapping("/{id}/payment-intent")
    public ResponseEntity<PaymentIntentResponseDto> createPaymentIntent(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireCustomerAction(id, user, guestToken);
        PaymentIntentResponseDto response = orderService.createPaymentIntentFor(id, user, guestToken);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<SavedAddress>> getSavedAddresses(
            @RequestParam(required = false) Long customerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        Long targetId = (user != null && user.getRole() == Role.CUSTOMER) ? user.getId() : customerId;
        accessGuard.requireAddressOwner(user, targetId);
        return ResponseEntity.ok(orderService.getSavedAddressesFor(targetId, user));
    }

    @PostMapping("/addresses")
    public ResponseEntity<SavedAddress> saveAddress(
            @RequestParam(required = false) Long customerId,
            @RequestParam String addressLine,
            @RequestParam(required = false) String city,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        Long targetId = (user != null && user.getRole() == Role.CUSTOMER) ? user.getId() : customerId;
        accessGuard.requireAddressOwner(user, targetId);
        return ResponseEntity.ok(orderService.saveAddressFor(targetId, addressLine, city, user));
    }

    @PostMapping("/claim")
    public ResponseEntity<ClaimOrdersResponseDto> claimGuestOrders(
            @RequestParam Long orderId,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user == null || user.getRole() != Role.CUSTOMER) {
            throw new OrderApiException(HttpStatus.UNAUTHORIZED, "CUSTOMER_REQUIRED", "Sign in as a customer to claim a guest order");
        }
        accessGuard.requireUsableAccount(user);
        accessGuard.requireGuestToken(orderId, guestToken);
        ClaimOrdersResponseDto response = orderService.claimGuestOrderFor(orderId, user.getId(), guestToken);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(OrderApiException.class)
    public ResponseEntity<Map<String, Object>> handleOrderApiException(OrderApiException ex) {
        return ResponseEntity.status(ex.getStatus()).body(Map.of(
                "error", ex.getCode(), "message", ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "VALIDATION_ERROR",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidBody(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst().map(error -> error.getDefaultMessage()).orElse("Invalid request body");
        return ResponseEntity.badRequest().body(Map.of("error", "VALIDATION_ERROR", "message", message));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "INVALID_OPERATION",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler({ObjectOptimisticLockingFailureException.class, OptimisticLockException.class})
    public ResponseEntity<Map<String, Object>> handleOptimisticLock(Exception ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.CONFLICT.value(),
                "error", "CONCURRENT_UPDATE",
                "message", "This order was just updated by another user or session. Please refresh to see the latest status."
        ));
    }

    @ExceptionHandler(OrderRateLimitExceededException.class)
    public ResponseEntity<Map<String, Object>> handleRateLimitExceeded(OrderRateLimitExceededException ex) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.TOO_MANY_REQUESTS.value(),
                "error", "RATE_LIMITED",
                "message", ex.getMessage()
        ));
    }
}
