package com.example.BigBite.order.event;

import com.example.BigBite.order.external.InventoryService.OrderLine;
import java.util.List;

public final class OrderEvents {
    private OrderEvents() { }

    public record Placed(Long orderId, Long branchId, List<OrderLine> lines, String promoCode, Long customerId) { }
    public record PreparingStarted(Long orderId) { }
    public record Cancelled(Long orderId, String reason) { }
    public record DeliveryFailed(Long orderId, String reason) { }
    public record Completed(Long orderId) { }
}
