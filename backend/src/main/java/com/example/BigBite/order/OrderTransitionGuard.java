package com.example.BigBite.order;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.util.Objects;

@Component
public class OrderTransitionGuard {
    public void checkStaff(Order order, OrderStatus target, User actor) {
        checkStaffActor(order, actor);
        boolean manager = actor.getRole() == Role.BRANCH_MANAGER;
        boolean rider = actor.getRole() == Role.DELIVERY_PARTNER && actor.getId().equals(order.getRiderId());
        boolean allowed = switch (order.getStatus()) {
            case PAYMENT_VERIFIED -> target == OrderStatus.CONFIRMED && manager;
            case CONFIRMED -> target == OrderStatus.PREPARING && manager;
            case PREPARING -> manager && ((order.getFulfillmentType() == FulfillmentType.TAKEAWAY
                    && target == OrderStatus.READY_FOR_PICKUP) || (order.getFulfillmentType() == FulfillmentType.DELIVERY
                    && target == OrderStatus.OUT_FOR_DELIVERY));
            case OUT_FOR_DELIVERY -> (manager || rider) && target == OrderStatus.DELIVERED
                    && order.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY;
            case DELIVERED -> (manager || rider) && target == OrderStatus.COMPLETED
                    && order.getPaymentStatus() == PaymentStatus.VERIFIED;
            case READY_FOR_PICKUP -> manager && target == OrderStatus.COMPLETED
                    && order.getPaymentStatus() == PaymentStatus.VERIFIED
                    && order.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY;
            default -> false;
        };
        if (!allowed) {
            throw new OrderApiException(HttpStatus.CONFLICT, "INVALID_TRANSITION",
                    "Cannot move order from " + order.getStatus() + " to " + target);
        }
    }

    public void checkStaffActor(Order order, User actor) {
        if (actor == null || (actor.getRole() != Role.BRANCH_MANAGER && actor.getRole() != Role.DELIVERY_PARTNER)) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "STAFF_REQUIRED", "This status change requires branch staff");
        }
        if (actor.getStatus() != UserStatus.APPROVED || !Objects.equals(actor.getBranchId(), order.getBranchId())
                || (actor.getRole() == Role.DELIVERY_PARTNER && !Objects.equals(actor.getId(), order.getRiderId()))) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "This order is outside your assignment");
        }
    }

    public void checkPayment(Order order, PaymentMethod method) {
        if (order.getStatus() != OrderStatus.PLACED ||
                (order.getPaymentStatus() != PaymentStatus.PENDING && order.getPaymentStatus() != PaymentStatus.FAILED)) {
            throw new OrderApiException(HttpStatus.CONFLICT, "ORDER_NOT_PAYABLE", "This order is no longer awaiting payment");
        }
        if (order.getPaymentStatus() != PaymentStatus.FAILED
                && order.getPaymentMethod() != null && order.getPaymentMethod() != method) {
            throw new OrderApiException(HttpStatus.CONFLICT, "PAYMENT_METHOD_LOCKED", "Payment method is already selected");
        }
    }

    public void checkCodCollect(Order order) {
        boolean handover = order.getFulfillmentType() == FulfillmentType.DELIVERY
                ? order.getStatus() == OrderStatus.OUT_FOR_DELIVERY
                : order.getStatus() == OrderStatus.READY_FOR_PICKUP;
        if (order.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY ||
                order.getPaymentStatus() != PaymentStatus.PENDING || !handover) {
            throw new OrderApiException(HttpStatus.CONFLICT, "COD_NOT_COLLECTABLE", "Cash cannot be collected at this stage");
        }
    }
}
