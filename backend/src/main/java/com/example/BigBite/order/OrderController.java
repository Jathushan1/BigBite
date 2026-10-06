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
import com.example.BigBite.order.dto.ComplaintRequestDto;
import com.example.BigBite.order.dto.DecisionNoteDto;
import com.example.BigBite.order.dto.FeedbackDto;
import com.example.BigBite.order.dto.OrderStatusHistoryDto;
import com.example.BigBite.order.dto.ReasonRequestDto;
import com.example.BigBite.order.dto.ReviewRequestDto;
import com.example.BigBite.order.dto.SavedAddressDto;
import com.example.BigBite.order.external.ComplaintService;
import com.example.BigBite.order.external.DeliveryService;
import com.example.BigBite.order.external.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
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
        } else if (user.getRole().isBranchScopedStaff()) {
            customerId = null;
            if (branchId == null) branchId = user.getBranchId();
        }
        accessGuard.requireList(user, customerId, branchId);
        List<OrderResponseDto> orders = orderService.getOrdersFor(customerId, branchId, status, user);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/riders")
    public ResponseEntity<List<DeliveryService.RiderAvailability>> getBranchRiders(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getRidersFor(getAuthenticatedUser(userDetails)));
    }

    @GetMapping("/refunds")
    public ResponseEntity<List<OrderResponseDto>> getRefundQueue(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(orderService.getRefundQueueFor(branchFor(user, branchId), user));
    }

    @GetMapping("/cancel-requests")
    public ResponseEntity<List<OrderResponseDto>> getCancelRequestQueue(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(orderService.getCancelRequestQueueFor(branchFor(user, branchId), user));
    }

    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintService.Complaint>> getBranchComplaints(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(orderService.getComplaintsFor(branchFor(user, branchId), user));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewService.Review>> getBranchReviews(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return ResponseEntity.ok(orderService.getReviewsFor(branchFor(user, branchId), user));
    }

    private Long branchFor(User user, Long requested) {
        if (user == null) {
            throw new OrderApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Authentication is required");
        }
        return requested != null ? requested : user.getBranchId();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponseDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireDeliveryAction(id, user);
        OrderResponseDto updated = orderService.updateOrderStatus(id, request.getStatus(), user,
                request.getRiderId(), request.getNote());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<OrderResponseDto> acceptOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.acceptOrderFor(id, getAuthenticatedUser(userDetails)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<OrderResponseDto> rejectOrder(
            @PathVariable Long id,
            @Valid @RequestBody ReasonRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.rejectOrderFor(id, getAuthenticatedUser(userDetails), request.reason()));
    }

    @PostMapping("/{id}/cancel-request")
    public ResponseEntity<OrderResponseDto> requestCancellation(
            @PathVariable Long id,
            @Valid @RequestBody ReasonRequestDto request,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.requestCancellationFor(id, getAuthenticatedUser(userDetails),
                guestToken, request.reason()));
    }

    @PostMapping("/{id}/cancel-request/approve")
    public ResponseEntity<OrderResponseDto> approveCancellation(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) DecisionNoteDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.resolveCancellationFor(id, getAuthenticatedUser(userDetails), true,
                request != null ? request.note() : null));
    }

    @PostMapping("/{id}/cancel-request/decline")
    public ResponseEntity<OrderResponseDto> declineCancellation(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) DecisionNoteDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.resolveCancellationFor(id, getAuthenticatedUser(userDetails), false,
                request != null ? request.note() : null));
    }

    @PostMapping("/{id}/refund/retry")
    public ResponseEntity<OrderResponseDto> retryRefund(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.retryRefundFor(id, getAuthenticatedUser(userDetails)));
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<DeliveryService.Tracking> getTracking(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        DeliveryService.Tracking tracking = orderService.getTrackingFor(id, getAuthenticatedUser(userDetails), guestToken);
        return tracking == null ? ResponseEntity.noContent().build() : ResponseEntity.ok(tracking);
    }

    @GetMapping("/{id}/feedback")
    public ResponseEntity<FeedbackDto> getFeedback(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(orderService.getFeedbackFor(id, getAuthenticatedUser(userDetails), guestToken));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ReviewService.Review> submitReview(
            @PathVariable Long id,
            @Valid @RequestBody ReviewRequestDto request,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.submitReviewFor(id,
                getAuthenticatedUser(userDetails), guestToken, request.rating(), request.comment()));
    }

    @PostMapping("/{id}/complaints")
    public ResponseEntity<ComplaintService.Complaint> fileComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ComplaintRequestDto request,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.fileComplaintFor(id,
                getAuthenticatedUser(userDetails), guestToken, request.category(), request.description()));
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
            boolean cancelled = result.order().getStatus() == OrderStatus.CANCELLED;
            int remaining = Math.max(0, orderService.getMaxCardAttempts() - result.order().getPaymentAttempts());
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("status", 402);
            body.put("error", cancelled ? "PAYMENT_FAILED" : "PAYMENT_DECLINED");
            body.put("declineCode", result.declineCode());
            body.put("message", cancelled
                    ? "Card declined " + orderService.getMaxCardAttempts() + " times; the order was cancelled"
                    : (result.declineMessage() != null ? result.declineMessage() : "Card payment declined")
                    + ". " + remaining + " attempt(s) left.");
            body.put("attemptsRemaining", remaining);
            body.put("order", result.order());
            return ResponseEntity.status(402).body(body);
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
        accessGuard.requireDeliveryAction(id, user);
        return ResponseEntity.ok(orderService.collectCod(id, request.cashCollected(), user));
    }

    @PostMapping("/{id}/delivery-failed")
    public ResponseEntity<OrderResponseDto> markDeliveryFailed(
            @PathVariable Long id,
            @Valid @RequestBody DeliveryFailedRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        accessGuard.requireDeliveryAction(id, user);
        return ResponseEntity.ok(orderService.markDeliveryFailed(id, request.reason(), user));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<OrderStatusHistoryDto>> getStatusHistory(
            @PathVariable Long id,
            @RequestHeader(name = "X-Guest-Token", required = false) String guestToken,
            @AuthenticationPrincipal UserDetails userDetails) {
        accessGuard.requireView(id, getAuthenticatedUser(userDetails), guestToken);
        return ResponseEntity.ok(orderService.getHistoryFor(id, getAuthenticatedUser(userDetails), guestToken));
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<SavedAddressDto>> getSavedAddresses(
            @RequestParam(required = false) Long customerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        Long targetId = (user != null && user.getRole() == Role.CUSTOMER) ? user.getId() : customerId;
        accessGuard.requireAddressOwner(user, targetId);
        return ResponseEntity.ok(orderService.getSavedAddressesFor(targetId, user));
    }

    @PostMapping("/addresses")
    public ResponseEntity<SavedAddressDto> saveAddress(
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
}
