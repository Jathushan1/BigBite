package com.example.BigBite.branch;

import com.example.BigBite.order.entity.Order;
import com.example.BigBite.order.entity.OrderItem;
import com.example.BigBite.order.repository.OrderRepository;
import com.example.BigBite.order.event.OrderEvents;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.LocalDateTime;

/**
 * Feeds branch sales reports from real orders: every order that reaches COMPLETED becomes one
 * {@link BranchSale}. Runs after the order transaction commits and is safe to receive twice.
 */
@Component
public class OrderSalesRecorder {

    private static final Logger log = LoggerFactory.getLogger(OrderSalesRecorder.class);

    private final OrderRepository orderRepository;
    private final BranchRepository branchRepository;
    private final BranchSaleRepository branchSaleRepository;

    public OrderSalesRecorder(OrderRepository orderRepository, BranchRepository branchRepository,
                              BranchSaleRepository branchSaleRepository) {
        this.orderRepository = orderRepository;
        this.branchRepository = branchRepository;
        this.branchSaleRepository = branchSaleRepository;
    }

    public static String orderNumberFor(Long orderId) {
        return "ORD-" + orderId;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOrderCompleted(OrderEvents.Completed event) {
        record(event.orderId());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean record(Long orderId) {
        String orderNumber = orderNumberFor(orderId);
        if (branchSaleRepository.existsByOrderNumber(orderNumber)) {
            return false;
        }
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) {
            return false;
        }
        Branch branch = branchRepository.findById(order.getBranchId()).orElse(null);
        if (branch == null) {
            log.warn("Order {} completed for unknown branch {}; no sale recorded", orderId, order.getBranchId());
            return false;
        }
        int items = order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
        LocalDateTime saleDate = order.getDeliveredAt() != null ? order.getDeliveredAt() : LocalDateTime.now();
        String method = order.getPaymentMethod() != null ? order.getPaymentMethod().name() : "OTHER";
        branchSaleRepository.save(new BranchSale(branch, orderNumber, order.getGrandTotal(), saleDate, method,
                "COMPLETED", Math.max(items, 1)));
        return true;
    }
}
