package com.example.BigBite.order.external;

public interface InventoryCheckService {
    boolean isInStock(Long menuItemId, int quantity);
    void decrementStock(Long menuItemId, int quantity);
}
