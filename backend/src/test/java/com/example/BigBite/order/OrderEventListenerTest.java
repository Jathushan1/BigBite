package com.example.BigBite.order;

import com.example.BigBite.order.event.OrderEvents;
import com.example.BigBite.order.external.InventoryService;
import com.example.BigBite.order.external.PromotionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;

import static org.mockito.Mockito.*;

@SpringBootTest
class OrderEventListenerTest {
    @Autowired private ApplicationEventPublisher events;
    @Autowired private TransactionTemplate transactions;
    @MockitoBean private InventoryService inventoryService;
    @MockitoBean private PromotionService promotionService;

    @Test
    void rollbackDoesNotReleaseResourcesButCommitDoes() {
        transactions.executeWithoutResult(status -> {
            events.publishEvent(new OrderEvents.Cancelled(42L, "TEST"));
            status.setRollbackOnly();
        });
        verifyNoInteractions(inventoryService, promotionService);

        transactions.executeWithoutResult(status ->
                events.publishEvent(new OrderEvents.Cancelled(43L, "TEST")));
        verify(inventoryService).release(43L);
        verify(promotionService).releaseRedemption(43L);
    }
}
