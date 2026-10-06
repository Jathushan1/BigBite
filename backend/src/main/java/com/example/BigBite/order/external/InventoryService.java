package com.example.BigBite.order.external;

import java.util.List;

/**
 * Port to the (future) inventory module. The order module reserves stock when an order is placed,
 * consumes it when the kitchen starts preparing, and releases it when the order is cancelled.
 */
public interface InventoryService {
    record OrderLine(Long menuItemId, int quantity) {}

    boolean canReserve(Long branchId, List<OrderLine> lines);
    /** Replaces the reservation for an order when called again after a pre-payment item edit. */
    void reserve(Long orderId, Long branchId, List<OrderLine> lines);
    void release(Long orderId);
    void consume(Long orderId);
    /** Food that was prepared but never handed over (failed delivery). */
    default void recordWaste(Long orderId, String reason) { }
}
