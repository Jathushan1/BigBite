package com.example.BigBite.order;

import com.example.BigBite.order.external.BranchLookupService;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CodEligibilityServiceTest {
    private final BranchLookupService branches = mock(BranchLookupService.class);
    private final OrderRepository orders = mock(OrderRepository.class);
    private final CodEligibilityService rules = new CodEligibilityService(branches, orders,
            false, new BigDecimal("10000.00"), 2, 2);

    private Order order(Long customerId, String amount) {
        Order order = new Order();
        order.setCustomerId(customerId);
        order.setBranchId(1L);
        order.setGrandTotal(new BigDecimal(amount));
        return order;
    }

    @Test
    void guestsAreIneligibleBeforeOtherChecks() {
        assertEquals("COD_LOGIN_REQUIRED", rules.evaluate(order(null, "1000")).code());
        verifyNoInteractions(branches, orders);
    }

    @Test
    void branchAndTotalRulesUseDocumentLimits() {
        Order customerOrder = order(4L, "1000");
        assertEquals("COD_DISABLED_AT_BRANCH", rules.evaluate(customerOrder).code());
        when(branches.acceptsCod(1L)).thenReturn(true);
        customerOrder.setGrandTotal(new BigDecimal("10000.01"));
        assertEquals("COD_LIMIT_EXCEEDED", rules.evaluate(customerOrder).code());
        customerOrder.setGrandTotal(new BigDecimal("10000.00"));
        assertTrue(rules.evaluate(customerOrder).eligible());
    }

    @Test
    void failedDeliveriesAndOpenOrdersBlockFurtherCod() {
        when(branches.acceptsCod(1L)).thenReturn(true);
        Order customerOrder = order(4L, "1000");
        when(orders.countByCustomerIdAndPaymentMethodAndStatus(4L,
                PaymentMethod.CASH_ON_DELIVERY, OrderStatus.DELIVERY_FAILED)).thenReturn(2L);
        assertEquals("COD_BLOCKED_FOR_CUSTOMER", rules.evaluate(customerOrder).code());
        when(orders.countByCustomerIdAndPaymentMethodAndStatus(4L,
                PaymentMethod.CASH_ON_DELIVERY, OrderStatus.DELIVERY_FAILED)).thenReturn(1L);
        when(orders.countOpenCodOrders(eq(4L), eq(PaymentMethod.CASH_ON_DELIVERY), anyList())).thenReturn(2L);
        assertEquals("TOO_MANY_OPEN_COD_ORDERS", rules.evaluate(customerOrder).code());
    }
}
