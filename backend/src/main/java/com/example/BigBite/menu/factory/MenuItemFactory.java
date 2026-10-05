package com.example.BigBite.menu.factory;

import com.example.BigBite.menu.entity.MenuItem;
import org.springframework.stereotype.Component;

/**
 * Factory Pattern: centralizes creation of a new MenuItem entity from request data.
 * The database ID and Branch are intentionally assigned elsewhere by the service.
 */
@Component
public class MenuItemFactory {

    public MenuItem createMenuItem(String menuName,
                                   String category,
                                   String description,
                                   double price,
                                   String photo,
                                   boolean availability) {
        MenuItem menuItem = new MenuItem();
        menuItem.setMenuName(menuName);
        menuItem.setCategory(category);
        menuItem.setDescription(description);
        menuItem.setPrice(price);
        menuItem.setPhoto(photo);
        menuItem.setAvailability(availability);
        return menuItem;
    }

    /** Copies client-provided menu fields into a fresh entity. */
    public MenuItem createMenuItem(MenuItem request) {
        if (request == null) {
            throw new IllegalArgumentException("Menu item data is required");
        }
        return createMenuItem(
                request.getMenuName(),
                request.getCategory(),
                request.getDescription(),
                request.getPrice(),
                request.getPhoto(),
                request.isAvailability()
        );
    }
}
