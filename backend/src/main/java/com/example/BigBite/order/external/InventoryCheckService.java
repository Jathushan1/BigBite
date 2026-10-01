package com.example.BigBite.order.external;

/** Compatibility adapter for existing inventory providers. New integrations should implement InventoryService. */
public interface InventoryCheckService extends InventoryService {
    boolean isInStock(Long menuItemId, int quantity);
    void decrementStock(Long menuItemId, int quantity);

    @Override
    default boolean canReserve(Long branchId, java.util.List<OrderLine> lines) {
        return lines.stream().allMatch(line -> isInStock(line.menuItemId(), line.quantity()));
    }

    @Override
    default void reserve(Long orderId, Long branchId, java.util.List<OrderLine> lines) {
        // Legacy implementations only support direct decrement. Their reservation is best effort.
        for (OrderLine line : lines) decrementStock(line.menuItemId(), line.quantity());
    }

    @Override default void release(Long orderId) { }
    @Override default void consume(Long orderId) { }
}
