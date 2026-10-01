package com.example.BigBite.order.event;

import com.example.BigBite.order.external.InventoryService;
import com.example.BigBite.order.external.PromotionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class OrderEventListener {
    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);
    private final InventoryService inventoryService;
    private final PromotionService promotionService;

    public OrderEventListener(InventoryService inventoryService, PromotionService promotionService) {
        this.inventoryService = inventoryService;
        this.promotionService = promotionService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPlaced(OrderEvents.Placed event) {
        if (event.promoCode() != null) {
            promotionService.reserveRedemption(event.orderId(), event.promoCode(), event.customerId());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPreparing(OrderEvents.PreparingStarted event) {
        inventoryService.consume(event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCancelled(OrderEvents.Cancelled event) {
        inventoryService.release(event.orderId());
        promotionService.releaseRedemption(event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFailed(OrderEvents.DeliveryFailed event) {
        promotionService.releaseRedemption(event.orderId());
        log.info("Delivery failed for order {}: {}; food may be wasted", event.orderId(), event.reason());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCompleted(OrderEvents.Completed event) {
        log.info("Order {} completed", event.orderId());
    }
}
