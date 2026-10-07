package com.example.BigBite.order;

import com.example.BigBite.order.entity.Order;
import com.example.BigBite.order.enums.FulfillmentType;
import com.example.BigBite.order.enums.OrderStatus;
import com.example.BigBite.order.repository.OrderRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrderConcurrencyTest {
    @Autowired private OrderRepository orders;
    @Autowired private EntityManagerFactory emf;

    @Test
    void staleStatusWriterCannotOverwriteNewerOrderState() {
        Order order = new Order();
        order.setBranchId(1L);
        order.setFulfillmentType(FulfillmentType.TAKEAWAY);
        order.setSubtotal(new BigDecimal("1200.00"));
        order.setGrandTotal(new BigDecimal("1260.00"));
        order = orders.saveAndFlush(order);

        EntityManager first = emf.createEntityManager();
        EntityManager stale = emf.createEntityManager();
        try {
            first.getTransaction().begin();
            stale.getTransaction().begin();
            Order current = first.find(Order.class, order.getId());
            Order oldCopy = stale.find(Order.class, order.getId());
            current.setStatus(OrderStatus.CONFIRMED);
            first.getTransaction().commit();
            oldCopy.setStatus(OrderStatus.CANCELLED);
            assertThrows(RuntimeException.class, () -> stale.getTransaction().commit());
            assertEquals(OrderStatus.CONFIRMED, orders.findById(order.getId()).orElseThrow().getStatus());
        } finally {
            if (first.getTransaction().isActive()) first.getTransaction().rollback();
            if (stale.getTransaction().isActive()) stale.getTransaction().rollback();
            first.close();
            stale.close();
        }
    }
}
