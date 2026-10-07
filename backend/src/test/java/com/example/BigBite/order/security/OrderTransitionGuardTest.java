package com.example.BigBite.order.security;

import com.example.BigBite.order.entity.Order;
import com.example.BigBite.order.enums.CancelRequestStatus;
import com.example.BigBite.order.enums.FulfillmentType;
import com.example.BigBite.order.enums.OrderStatus;
import com.example.BigBite.order.enums.PaymentMethod;
import com.example.BigBite.order.enums.PaymentStatus;
import com.example.BigBite.order.exception.OrderApiException;
import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrderTransitionGuardTest {
    private final OrderTransitionGuard guard = new OrderTransitionGuard();

    private User actor(Role role, long id, long branchId) {
        User user = new User("Staff", "staff@example.com", "secret", role, UserStatus.APPROVED);
        user.setId(id);
        user.setBranchId(branchId);
        return user;
    }

    private Order order(OrderStatus status, PaymentMethod method, FulfillmentType fulfillment) {
        Order order = new Order();
        order.setBranchId(1L);
        order.setStatus(status);
        order.setPaymentMethod(method);
        order.setFulfillmentType(fulfillment);
        return order;
    }

    @Test
    void cardMustBeVerifiedBeforeKitchenStarts() {
        Order unpaid = order(OrderStatus.PLACED, PaymentMethod.CREDIT_CARD, FulfillmentType.DELIVERY);
        OrderApiException error = assertThrows(OrderApiException.class,
                () -> guard.checkStaff(unpaid, OrderStatus.PREPARING, actor(Role.STAFF, 1, 1)));
        assertEquals("INVALID_TRANSITION", error.getCode());
    }

    @Test
    void codCannotCompleteUntilCashIsRecorded() {
        Order cod = order(OrderStatus.READY_FOR_PICKUP, PaymentMethod.CASH_ON_DELIVERY, FulfillmentType.TAKEAWAY);
        cod.setPaymentStatus(PaymentStatus.PENDING);
        User manager = actor(Role.STAFF, 1, 1);
        assertThrows(OrderApiException.class, () -> guard.checkStaff(cod, OrderStatus.COMPLETED, manager));
        cod.setPaymentStatus(PaymentStatus.VERIFIED);
        assertThrows(OrderApiException.class, () -> guard.checkStaff(cod, OrderStatus.COMPLETED, manager));
    }

    @Test
    void crossBranchStaffAndUnassignedRiderAreRejected() {
        Order delivery = order(OrderStatus.OUT_FOR_DELIVERY, PaymentMethod.CREDIT_CARD, FulfillmentType.DELIVERY);
        delivery.setRiderId(7L);
        assertEquals("ACCESS_DENIED", assertThrows(OrderApiException.class,
                () -> guard.checkStaff(delivery, OrderStatus.DELIVERED, actor(Role.STAFF, 2, 3))).getCode());
        assertEquals("ACCESS_DENIED", assertThrows(OrderApiException.class,
                () -> guard.checkStaff(delivery, OrderStatus.DELIVERED, actor(Role.DELIVERY_PARTNER, 8, 1))).getCode());
        assertDoesNotThrow(() -> guard.checkStaff(delivery, OrderStatus.DELIVERED, actor(Role.DELIVERY_PARTNER, 7, 1)));
        Order waiting = order(OrderStatus.PAYMENT_VERIFIED, PaymentMethod.CREDIT_CARD, FulfillmentType.DELIVERY);
        waiting.setRiderId(7L);
        assertEquals("INVALID_TRANSITION", assertThrows(OrderApiException.class,
                () -> guard.checkStaff(waiting, OrderStatus.CONFIRMED,
                        actor(Role.DELIVERY_PARTNER, 7, 1))).getCode());
    }

    @Test
    void paymentCannotChangeAfterConfirmation() {
        Order confirmed = order(OrderStatus.CONFIRMED, PaymentMethod.CASH_ON_DELIVERY, FulfillmentType.DELIVERY);
        assertEquals("ORDER_NOT_PAYABLE", assertThrows(OrderApiException.class,
                () -> guard.checkPayment(confirmed, PaymentMethod.CREDIT_CARD)).getCode());
        Order declined = order(OrderStatus.PLACED, PaymentMethod.CREDIT_CARD, FulfillmentType.DELIVERY);
        declined.setPaymentStatus(PaymentStatus.FAILED);
        assertDoesNotThrow(() -> guard.checkPayment(declined, PaymentMethod.DEBIT_CARD));
    }

    @Test
    void branchManagerCannotRunTheOrderPipeline() {
        Order waiting = order(OrderStatus.PAYMENT_VERIFIED, PaymentMethod.CREDIT_CARD, FulfillmentType.DELIVERY);
        assertEquals("STAFF_REQUIRED", assertThrows(OrderApiException.class,
                () -> guard.checkStaff(waiting, OrderStatus.CONFIRMED, actor(Role.BRANCH_MANAGER, 1, 1))).getCode());
        assertDoesNotThrow(() -> guard.checkStaff(waiting, OrderStatus.CONFIRMED, actor(Role.STAFF, 1, 1)));
    }

    @Test
    void codOrderIsAcceptedFromPlacedButUnpaidCardIsNot() {
        Order cod = order(OrderStatus.PLACED, PaymentMethod.CASH_ON_DELIVERY, FulfillmentType.DELIVERY);
        assertDoesNotThrow(() -> guard.checkStaff(cod, OrderStatus.CONFIRMED, actor(Role.STAFF, 1, 1)));
        Order unpaidCard = order(OrderStatus.PLACED, PaymentMethod.CREDIT_CARD, FulfillmentType.DELIVERY);
        assertThrows(OrderApiException.class,
                () -> guard.checkStaff(unpaidCard, OrderStatus.CONFIRMED, actor(Role.STAFF, 1, 1)));
    }

    @Test
    void pendingCancelRequestBlocksTheKitchen() {
        Order confirmed = order(OrderStatus.CONFIRMED, PaymentMethod.CREDIT_CARD, FulfillmentType.DELIVERY);
        confirmed.setCancelRequestStatus(CancelRequestStatus.PENDING);
        assertEquals("CANCEL_REQUEST_PENDING", assertThrows(OrderApiException.class,
                () -> guard.checkStaff(confirmed, OrderStatus.PREPARING, actor(Role.STAFF, 1, 1))).getCode());
    }
}
