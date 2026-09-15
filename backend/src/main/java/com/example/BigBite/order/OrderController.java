package com.example.BigBite.order;

import com.example.BigBite.order.dto.BillDto;
import com.example.BigBite.order.dto.OrderRequestDto;
import com.example.BigBite.order.dto.OrderResponseDto;
import com.example.BigBite.order.dto.OrderStatusUpdateRequestDto;
import com.example.BigBite.order.dto.PaymentRequestDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.order.dto.PaymentIntentResponseDto;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    public OrderController(OrderService orderService, UserRepository userRepository) {
        this.orderService = orderService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        if (userDetails == null || userRepository == null) return null;
        return userRepository.findByEmail(userDetails.getUsername()).orElse(null);
    }

    @PostMapping
    public ResponseEntity<OrderResponseDto> placeOrder(
            @Valid @RequestBody OrderRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user != null) {
            request.setCustomerId(user.getId());
            if (request.getContactName() == null || request.getContactName().isBlank()) {
                request.setContactName(user.getName());
            }
            if (request.getContactPhone() == null || request.getContactPhone().isBlank()) {
                request.setContactPhone(user.getPhoneNumber());
            }
        }

        OrderResponseDto response = orderService.placeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDto> getOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        OrderResponseDto response = orderService.getOrderById(id);
        User user = getAuthenticatedUser(userDetails);
        if (user != null && user.getRole() == Role.CUSTOMER) {
            if (response.getCustomerId() != null && !response.getCustomerId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: you do not own this order");
            }
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDto>> getOrders(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) OrderStatus status,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user != null && user.getRole() == Role.CUSTOMER) {
            List<OrderResponseDto> orders = orderService.getOrders(user.getId(), null, status);
            return ResponseEntity.ok(orders);
        }

        if (user != null && user.getRole() == Role.BRANCH_MANAGER && user.getBranchId() != null) {
            Long effectiveBranch = (branchId != null) ? branchId : user.getBranchId();
            List<OrderResponseDto> orders = orderService.getOrders(null, effectiveBranch, status);
            return ResponseEntity.ok(orders);
        }

        List<OrderResponseDto> orders = orderService.getOrders(customerId, branchId, status);
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<OrderResponseDto> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user != null && user.getRole() == Role.CUSTOMER) {
            throw new AccessDeniedException("Access denied: customers cannot update order status");
        }
        OrderResponseDto updated = orderService.updateOrderStatus(id, request.getStatus());
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponseDto> cancelOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user != null && user.getRole() == Role.CUSTOMER) {
            OrderResponseDto order = orderService.getOrderById(id);
            if (order.getCustomerId() != null && !order.getCustomerId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: you cannot cancel an order belonging to another customer");
            }
        }
        OrderResponseDto cancelled = orderService.cancelOrder(id);
        return ResponseEntity.ok(cancelled);
    }

    @GetMapping("/{id}/bill")
    public ResponseEntity<BillDto> getBill(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        BillDto bill = orderService.getOrderBill(id);
        User user = getAuthenticatedUser(userDetails);
        if (user != null && user.getRole() == Role.CUSTOMER) {
            if (bill.getCustomerId() != null && !bill.getCustomerId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: you do not own this order bill");
            }
        }
        return ResponseEntity.ok(bill);
    }

    @PostMapping("/{id}/payment")
    public ResponseEntity<OrderResponseDto> recordPayment(
            @PathVariable Long id,
            @RequestBody PaymentRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user != null && user.getRole() == Role.CUSTOMER) {
            OrderResponseDto order = orderService.getOrderById(id);
            if (order.getCustomerId() != null && !order.getCustomerId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: you do not own this order");
            }
        }
        OrderResponseDto updated = orderService.recordPayment(id, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/payment-intent")
    public ResponseEntity<PaymentIntentResponseDto> createPaymentIntent(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        if (user != null && user.getRole() == Role.CUSTOMER) {
            OrderResponseDto order = orderService.getOrderById(id);
            if (order.getCustomerId() != null && !order.getCustomerId().equals(user.getId())) {
                throw new AccessDeniedException("Access denied: you do not own this order");
            }
        }
        PaymentIntentResponseDto response = orderService.createPaymentIntent(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<SavedAddress>> getSavedAddresses(
            @RequestParam(required = false) Long customerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        Long targetId = (user != null && user.getRole() == Role.CUSTOMER) ? user.getId() : customerId;
        return ResponseEntity.ok(orderService.getSavedAddresses(targetId));
    }

    @PostMapping("/addresses")
    public ResponseEntity<SavedAddress> saveAddress(
            @RequestParam(required = false) Long customerId,
            @RequestParam String addressLine,
            @RequestParam(required = false) String city,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        Long targetId = (user != null && user.getRole() == Role.CUSTOMER) ? user.getId() : customerId;
        return ResponseEntity.ok(orderService.saveAddress(targetId, addressLine, city));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "Bad Request",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "timestamp", LocalDateTime.now(),
                "status", HttpStatus.BAD_REQUEST.value(),
                "error", "Invalid Operation",
                "message", ex.getMessage()
        ));
    }
}
