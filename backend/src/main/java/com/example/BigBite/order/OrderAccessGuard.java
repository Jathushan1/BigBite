package com.example.BigBite.order;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

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
        if (actor != null && actor.getRole() == Role.CUSTOMER && actor.getId().equals(order.getCustomerId())) return order;
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
        if (actor != null && actor.getRole() == Role.BRANCH_MANAGER && sameBranch(order, actor)) return order;
        return requireCustomerAction(orderId, actor, guestToken);
    }

    public Order requireStaffAction(Long orderId, User actor) {
        requireUsableAccount(actor);
        Order order = load(orderId);
        if (actor == null) deny(null);
        if (actor.getRole() == Role.BRANCH_MANAGER && sameBranch(order, actor)) return order;
        if (actor.getRole() == Role.DELIVERY_PARTNER && sameBranch(order, actor)
                && actor.getId().equals(order.getRiderId())) return order;
        deny(actor);
        return order;
    }

    public void requireList(User actor, Long customerId, Long branchId) {
        if (actor == null) deny(null);
        requireUsableAccount(actor);
        if (actor.getRole() == Role.SUPER_ADMIN) return;
        if (actor.getRole() == Role.CUSTOMER && actor.getId().equals(customerId) && branchId == null) return;
        if ((actor.getRole() == Role.BRANCH_MANAGER || actor.getRole() == Role.DELIVERY_PARTNER)
                && actor.getBranchId() != null && actor.getBranchId().equals(branchId) && customerId == null) return;
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
        if (actor == null) return guestTokens.matches(order, guestToken);
        return switch (actor.getRole()) {
            case SUPER_ADMIN -> true;
            case CUSTOMER -> actor.getId().equals(order.getCustomerId());
            case BRANCH_MANAGER -> sameBranch(order, actor);
            case DELIVERY_PARTNER -> sameBranch(order, actor) && actor.getId().equals(order.getRiderId());
        };
    }

    public void requireUsableAccount(User actor) {
        if (actor == null) return;
        boolean usable = switch (actor.getRole()) {
            case CUSTOMER, SUPER_ADMIN -> actor.getStatus() == UserStatus.ACTIVE;
            case BRANCH_MANAGER, DELIVERY_PARTNER -> actor.getStatus() == UserStatus.APPROVED;
        };
        if (!usable) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE",
                    "This account cannot access orders in its current state");
        }
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
