package com.example.BigBite.menu.strategy;

import com.example.BigBite.menu.entity.MenuItem;
import org.springframework.stereotype.Component;

/** Default validation strategy for menu items. */
@Component
public class DefaultMenuItemValidationStrategy implements MenuItemValidationStrategy {

    @Override
    public void validate(MenuItem menuItem) {
        if (menuItem == null) {
            throw new IllegalArgumentException("Menu item data is required");
        }
        if (menuItem.getMenuName() == null || menuItem.getMenuName().isBlank()) {
            throw new IllegalArgumentException("Menu name is required");
        }
        if (menuItem.getPrice() < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }
    }
}
