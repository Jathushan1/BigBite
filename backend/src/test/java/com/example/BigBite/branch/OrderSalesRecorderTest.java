package com.example.BigBite.branch;

import com.example.BigBite.order.FulfillmentType;
import com.example.BigBite.order.Order;
import com.example.BigBite.order.OrderItem;
import com.example.BigBite.order.OrderRepository;
import com.example.BigBite.order.OrderStatus;
import com.example.BigBite.order.PaymentMethod;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrderSalesRecorderTest {

    @Autowired private OrderSalesRecorder recorder;
    @Autowired private OrderRepository orders;
    @Autowired private BranchRepository branches;
    @Autowired private BranchSaleRepository sales;
    @Autowired private BranchService branchService;

    @Test
    void completedOrderIsRecordedOnceAndShowsInTheMonthlyReport() {
        Branch branch = branches.save(new Branch("Recorder Branch", "REC" + System.nanoTime() % 100000,
                "1 Road", "Colombo", "0112345678", "rec@bigbite.lk"));
        Order order = new Order();
        order.setBranchId(branch.getId());
        order.setFulfillmentType(FulfillmentType.TAKEAWAY);
        order.setStatus(OrderStatus.COMPLETED);
        order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        order.setSubtotal(new BigDecimal("2400.00"));
        order.setGrandTotal(new BigDecimal("2520.00"));
        order.addItem(new OrderItem(1L, "Pizza", new BigDecimal("1200.00"), 2, new BigDecimal("2400.00")));
        order = orders.saveAndFlush(order);

        assertTrue(recorder.record(order.getId()));
        assertFalse(recorder.record(order.getId()), "a repeated completion event must not double count");
        assertEquals(1, sales.countByBranchId(branch.getId()));

        LocalDate today = LocalDate.now();
        var report = branchService.generateBranchMonthlySalesReport(branch.getId(), today.getYear(), today.getMonthValue());
        assertEquals(new BigDecimal("2520.00"), report.getTotalRevenue());
        assertEquals(1, report.getTotalOrders());
        assertEquals(new BigDecimal("2520.00"), report.getRevenueByPaymentMethod().get("CASH_ON_DELIVERY"));
    }
}
