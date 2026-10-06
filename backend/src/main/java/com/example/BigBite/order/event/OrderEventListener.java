package com.example.BigBite.order.event;

import com.example.BigBite.order.external.DeliveryService;
import com.example.BigBite.order.external.InventoryService;
import com.example.BigBite.order.external.PromotionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** Forwards committed order lifecycle changes to the neighbouring modules (inventory, promotions, delivery). */
@Component
public class OrderEventListener {
    private static final Logger log = LoggerFactory.getLogger(OrderEventListener.class);
    private final InventoryService inventoryService;
    private final PromotionService promotionService;
    private final DeliveryService deliveryService;

    public OrderEventListener(InventoryService inventoryService, PromotionService promotionService,
                              DeliveryService deliveryService) {
        this.inventoryService = inventoryService;
        this.promotionService = promotionService;
        this.deliveryService = deliveryService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPlaced(OrderEvents.Placed event) {
        if (event.promoCode() != null) {
            promotionService.reserveRedemption(event.orderId(), event.promoCode(), event.customerId());
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAccepted(OrderEvents.Accepted event) {
        log.info("Order {} accepted by staff {}", event.orderId(), event.staffId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPreparing(OrderEvents.PreparingStarted event) {
        inventoryService.consume(event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDispatched(OrderEvents.Dispatched event) {
        deliveryService.onDispatched(event.orderId(), event.riderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDelivered(OrderEvents.Delivered event) {
        deliveryService.onDelivered(event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCancelRequested(OrderEvents.CancelRequested event) {
        log.info("Customer asked to cancel order {}: {}", event.orderId(), event.reason());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCancelled(OrderEvents.Cancelled event) {
        inventoryService.release(event.orderId());
        promotionService.releaseRedemption(event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onFailed(OrderEvents.DeliveryFailed event) {
        promotionService.releaseRedemption(event.orderId());
        inventoryService.recordWaste(event.orderId(), event.reason());
        deliveryService.onDeliveryFailed(event.orderId(), event.reason());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onCompleted(OrderEvents.Completed event) {
        log.info("Order {} completed", event.orderId());
    }
}
