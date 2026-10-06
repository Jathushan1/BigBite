package com.example.BigBite.order;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrderMigrationTest {
    @Autowired private OrderRepository orders;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DataSource dataSource;

    private Order legacy(PaymentMethod method, PaymentStatus payment, OrderStatus status) {
        Order order = new Order();
        order.setBranchId(1L);
        order.setFulfillmentType(FulfillmentType.DELIVERY);
        order.setDeliveryAddress("Legacy address");
        order.setGuestName("Legacy guest");
        order.setGuestPhone("0771234567");
        order.setPaymentMethod(method);
        order.setPaymentStatus(payment);
        order.setStatus(status);
        order.setSubtotal(new BigDecimal("1000.00"));
        order.setTaxAmount(new BigDecimal("50.00"));
        order.setDeliveryFee(new BigDecimal("300.00"));
        order.setGrandTotal(new BigDecimal("1350.00"));
        return orders.saveAndFlush(order);
    }

    @Test
    void backfillClassifiesLegacyOrdersWithoutChangingAmountsOrCreatingGuestTokens() {
        Order card = legacy(null, PaymentStatus.VERIFIED, OrderStatus.CONFIRMED);
        Order cod = legacy(PaymentMethod.CASH_ON_DELIVERY, PaymentStatus.VERIFIED, OrderStatus.PAYMENT_VERIFIED);
        Order pendingRefund = legacy(PaymentMethod.CARD_STRIPE, PaymentStatus.VERIFIED, OrderStatus.CANCELLED);
        pendingRefund.setRefundStatus(RefundStatus.PENDING);
        orders.saveAndFlush(pendingRefund);
        Order voided = legacy(PaymentMethod.CASH_ON_DELIVERY, PaymentStatus.PENDING, OrderStatus.CANCELLED);
        ResourceDatabasePopulator backfill = new ResourceDatabasePopulator(
                new ClassPathResource("order_module_v2_backfill_h2.sql"));
        backfill.execute(dataSource);
        backfill.execute(dataSource);

        assertEquals("CREDIT_CARD", jdbc.queryForObject(
                "SELECT payment_method FROM orders WHERE id = ?", String.class, card.getId()));
        assertEquals("CONFIRMED", jdbc.queryForObject(
                "SELECT status FROM orders WHERE id = ?", String.class, card.getId()));
        assertEquals("DELIVERED", jdbc.queryForObject(
                "SELECT status FROM orders WHERE id = ?", String.class, cod.getId()));
        assertEquals("REFUND_PENDING", jdbc.queryForObject(
                "SELECT payment_status FROM orders WHERE id = ?", String.class, pendingRefund.getId()));
        assertEquals("VOIDED", jdbc.queryForObject(
                "SELECT payment_status FROM orders WHERE id = ?", String.class, voided.getId()));
        assertEquals(new BigDecimal("1350.00"), jdbc.queryForObject(
                "SELECT grand_total FROM orders WHERE id = ?", BigDecimal.class, card.getId()));
        assertEquals(1, jdbc.queryForObject(
                "SELECT COUNT(*) FROM order_status_history WHERE order_id = ?", Integer.class, card.getId()));
        assertNull(jdbc.queryForObject("SELECT guest_access_nonce FROM orders WHERE id = ?",
                String.class, card.getId()));
    }

    @Test
    void timeoutQueryNeverSelectsCodEvenWithLegacyPlacedStatus() {
        Order card = legacy(null, PaymentStatus.PENDING, OrderStatus.PLACED);
        Order cod = legacy(PaymentMethod.CASH_ON_DELIVERY, PaymentStatus.PENDING, OrderStatus.PLACED);
        LocalDateTime old = LocalDateTime.now().minusMinutes(30);
        jdbc.update("UPDATE orders SET created_at = ? WHERE id IN (?, ?)", old, card.getId(), cod.getId());

        List<Order> timedOut = orders.findAbandonedCardOrders(OrderStatus.PLACED,
                List.of(PaymentStatus.PENDING, PaymentStatus.FAILED), PaymentMethod.CASH_ON_DELIVERY,
                LocalDateTime.now().minusMinutes(15));
        assertTrue(timedOut.stream().anyMatch(order -> order.getId().equals(card.getId())));
        assertFalse(timedOut.stream().anyMatch(order -> order.getId().equals(cod.getId())));
    }
}
