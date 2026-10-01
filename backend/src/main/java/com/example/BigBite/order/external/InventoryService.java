package com.example.BigBite.order.external;

import java.util.List;

public interface InventoryService {
    record OrderLine(Long menuItemId, int quantity) {}

    boolean canReserve(Long branchId, List<OrderLine> lines);
    /** Replaces the reservation for an order when called again after a pre-payment item edit. */
    void reserve(Long orderId, Long branchId, List<OrderLine> lines);
    void release(Long orderId);
    void consume(Long orderId);
}
