package com.example.BigBite.order;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * The order state machine for branch-side actors.
 * <pre>
 * awaiting acceptance --STAFF accept--> CONFIRMED --STAFF--> PREPARING
 * PREPARING --STAFF--> READY_FOR_PICKUP (takeaway) | OUT_FOR_DELIVERY (delivery, rider required)
 * OUT_FOR_DELIVERY --STAFF/rider--> DELIVERED (card) ; COD goes through cash collection
 * DELIVERED --STAFF/rider--> COMPLETED (payment verified)
 * READY_FOR_PICKUP --STAFF--> COMPLETED (card) ; COD goes through counter cash collection
 * </pre>
 */
@Component
public class OrderTransitionGuard {

    public void checkStaff(Order order, OrderStatus target, User actor) {
        checkStaffActor(order, actor);
        if (order.getCancelRequestStatus() == CancelRequestStatus.PENDING) {
            throw new OrderApiException(HttpStatus.CONFLICT, "CANCEL_REQUEST_PENDING",
                    "Resolve the customer's cancellation request before moving this order");
        }
        boolean staff = actor.getRole() == Role.STAFF;
        boolean rider = actor.getRole() == Role.DELIVERY_PARTNER && actor.getId().equals(order.getRiderId());
        boolean allowed;
        if (order.isAwaitingAcceptance()) {
            allowed = staff && target == OrderStatus.CONFIRMED;
        } else {
            allowed = switch (order.getStatus()) {
                case CONFIRMED -> target == OrderStatus.PREPARING && staff;
                case PREPARING -> staff && ((order.getFulfillmentType() == FulfillmentType.TAKEAWAY
                        && target == OrderStatus.READY_FOR_PICKUP) || (order.getFulfillmentType() == FulfillmentType.DELIVERY
                        && target == OrderStatus.OUT_FOR_DELIVERY));
                case OUT_FOR_DELIVERY -> (staff || rider) && target == OrderStatus.DELIVERED
                        && order.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY;
                case DELIVERED -> (staff || rider) && target == OrderStatus.COMPLETED
                        && order.getPaymentStatus() == PaymentStatus.VERIFIED;
                case READY_FOR_PICKUP -> staff && target == OrderStatus.COMPLETED
                        && order.getPaymentStatus() == PaymentStatus.VERIFIED
                        && order.getPaymentMethod() != PaymentMethod.CASH_ON_DELIVERY;
                default -> false;
            };
        }
        if (!allowed) {
            throw new OrderApiException(HttpStatus.CONFLICT, "INVALID_TRANSITION",
                    "Cannot move order from " + order.getStatus() + " to " + target);
        }
    }

    public void checkStaffActor(Order order, User actor) {
        if (actor == null || (actor.getRole() != Role.STAFF && actor.getRole() != Role.DELIVERY_PARTNER)) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "STAFF_REQUIRED", "This status change requires branch staff");
        }
        if (actor.getStatus() != UserStatus.APPROVED || !Objects.equals(actor.getBranchId(), order.getBranchId())
                || (actor.getRole() == Role.DELIVERY_PARTNER && !Objects.equals(actor.getId(), order.getRiderId()))) {
            throw new OrderApiException(HttpStatus.FORBIDDEN, "ACCESS_DENIED", "This order is outside your assignment");
        }
    }

    public void checkPayment(Order order, PaymentMethod method) {
        if (order.getStatus() != OrderStatus.PLACED ||
                (order.getPaymentStatus() != PaymentStatus.PENDING && order.getPaymentStatus() != PaymentStatus.FAILED)
                || order.getPaymentMethod() == PaymentMethod.CASH_ON_DELIVERY) {
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
