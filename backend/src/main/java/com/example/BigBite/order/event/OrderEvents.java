package com.example.BigBite.order.event;

import com.example.BigBite.order.external.InventoryService.OrderLine;

import java.util.List;

public final class OrderEvents {
    private OrderEvents() { }

    public record Placed(Long orderId, Long branchId, List<OrderLine> lines, String promoCode, Long customerId) { }
    public record Accepted(Long orderId, Long branchId, Long staffId) { }
    public record PreparingStarted(Long orderId) { }
    public record Dispatched(Long orderId, Long riderId) { }
    public record Delivered(Long orderId) { }
    public record CancelRequested(Long orderId, Long branchId, String reason) { }
    public record Cancelled(Long orderId, String reason) { }
    public record DeliveryFailed(Long orderId, String reason) { }
    public record Completed(Long orderId) { }
}
