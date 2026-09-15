package com.example.BigBite.order.external;

import org.springframework.stereotype.Component;

@Component
public class MockInventoryCheckService implements InventoryCheckService {

    @Override
    public boolean isInStock(Long menuItemId, int quantity) {
        return true;
    }

    @Override
    public void decrementStock(Long menuItemId, int quantity) {
        // Mock implementation: no-op
    }
}
