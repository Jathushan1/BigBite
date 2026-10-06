package com.example.BigBite.order;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

/**
 * Who may see or touch an order.
 * <ul>
 *   <li>STAFF of the order's branch run the whole order pipeline.</li>
 *   <li>BRANCH_MANAGER of the branch has read-only visibility.</li>
 *   <li>DELIVERY_PARTNER sees and updates only orders assigned to them.</li>
 *   <li>CUSTOMER (or a guest holding the guest token) owns their order.</li>
 *   <li>SUPER_ADMIN can see everything and force a cancellation.</li>
 * </ul>
 */
@Service
public class OrderAccessGuard {
    private final OrderRepository orders;
    private final GuestTokenService guestTokens;

    public OrderAccessGuard(OrderRepository orders, GuestTokenService guestTokens) {
        this.orders = orders;
        this.guestTokens = guestTokens;
    }

    public Order requireView(Long orderId, User actor, String guestToken) {
        requireUsableAccount(actor);
        Order order = load(orderId);
        if (canView(order, actor, guestToken)) return order;
        deny(actor);
        return order;
    }

    public Order requireCustomerAction(Long orderId, User actor, String guestToken) {
        requireUsableAccount(actor);
        Order order = load(orderId);
        if (isOwner(order, actor)) return order;
        if (guestTokens.matches(order, guestToken)) return order;
        deny(actor);
        return order;
    }

    public Order requireGuestToken(Long orderId, String guestToken) {
        Order order = load(orderId);
        if (guestTokens.matches(order, guestToken)) return order;
        throw new OrderApiException(HttpStatus.FORBIDDEN, "INVALID_GUEST_TOKEN", "A valid guest token is required for this order");
    }

    public Order requireCancel(Long orderId, User actor, String guestToken) {
        requireUsableAccount(actor);
        Order order = load(orderId);
        if (actor != null && actor.getRole() == Role.SUPER_ADMIN) return order;
        if (actor != null && actor.getRole() == Role.STAFF && sameBranch(order, actor)) return order;
        return requireCustomerAction(orderId, actor, guestToken);
    }

    /** Kitchen and counter actions: accept, reject, prepare, dispatch, counter cash, cancel requests, refunds. */
    public Order requireStaffAction(Long orderId, User actor) {
        requireUsableAccount(actor);
        if (actor == null) deny(null);
        Order order = load(orderId);
        if (actor.getRole() == Role.STAFF && sameBranch(order, actor)) return order;
        throw new OrderApiException(HttpStatus.FORBIDDEN, "STAFF_REQUIRED",
                "Only branch staff of this order's branch can do this");
    }

    /** Hand-over actions: delivered, delivery cash, delivery failed. Branch staff or the assigned rider. */
    public Order requireDeliveryAction(Long orderId, User actor) {
        requireUsableAccount(actor);
        if (actor == null) deny(null);
        Order order = load(orderId);
        if (actor.getRole() == Role.STAFF && sameBranch(order, actor)) return order;
        if (isAssignedRider(order, actor)) return order;
        throw new OrderApiException(HttpStatus.FORBIDDEN, "STAFF_REQUIRED",
                "Only branch staff or the assigned rider can do this");
    }

    public void requireList(User actor, Long customerId, Long branchId) {
        if (actor == null) deny(null);
        requireUsableAccount(actor);
        if (actor.getRole() == Role.SUPER_ADMIN) return;
        if (actor.getRole() == Role.CUSTOMER && actor.getId().equals(customerId) && branchId == null) return;
        if (actor.getRole().isBranchScopedStaff()
                && actor.getBranchId() != null && actor.getBranchId().equals(branchId) && customerId == null) return;
        deny(actor);
    }

    /** Branch-wide queues (refunds, cancel requests, complaints, reviews): branch staff, its manager, or admin. */
    public void requireBranchQueue(User actor, Long branchId) {
        if (actor == null) deny(null);
        requireUsableAccount(actor);
        if (actor.getRole() == Role.SUPER_ADMIN) return;
        if ((actor.getRole() == Role.STAFF || actor.getRole() == Role.BRANCH_MANAGER)
                && actor.getBranchId() != null && actor.getBranchId().equals(branchId)) return;
        deny(actor);
    }

    public void requireAddressOwner(User actor, Long customerId) {
        if (actor == null) deny(null);
        requireUsableAccount(actor);
        if (actor.getRole() == Role.CUSTOMER && actor.getId().equals(customerId)) return;
        if (actor.getRole() == Role.SUPER_ADMIN) return;
        deny(actor);
    }

    private boolean canView(Order order, User actor, String guestToken) {
        if (guestTokens.matches(order, guestToken)) return true;
        if (actor == null) return false;
        return switch (actor.getRole()) {
            case SUPER_ADMIN -> true;
            case CUSTOMER -> actor.getId().equals(order.getCustomerId());
            case BRANCH_MANAGER, STAFF -> sameBranch(order, actor);
            case DELIVERY_PARTNER -> isAssignedRider(order, actor);
        };
    }

    public void requireUsableAccount(User actor) {
        if (actor == null) return;
        boolean usable = switch (actor.getRole()) {
            case CUSTOMER, SUPER_ADMIN -> actor.getStatus() == UserStatus.ACTIVE;
            case BRANCH_MANAGER, STAFF, DELIVERY_PARTNER -> actor.getStatus() == UserStatus.APPROVED;
        };
        if (!usable) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE",
                    "This account cannot access orders in its current state");
        }
    }

    private boolean isOwner(Order order, User actor) {
        return actor != null && actor.getRole() == Role.CUSTOMER && actor.getId().equals(order.getCustomerId());
    }

    private boolean isAssignedRider(Order order, User actor) {
        return actor.getRole() == Role.DELIVERY_PARTNER && sameBranch(order, actor)
                && actor.getId().equals(order.getRiderId());
    }

    private boolean sameBranch(Order order, User actor) {
        return actor.getBranchId() != null && actor.getBranchId().equals(order.getBranchId());
    }

    private Order load(Long orderId) {
        return orders.findById(orderId).orElseThrow(() ->
                new OrderApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));
    }

    private void deny(User actor) {
        if (actor == null) throw new OrderApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Authentication or a valid guest token is required");
        throw new OrderApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "You do not have access to this order");
    }
}
