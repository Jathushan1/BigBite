package com.example.BigBite.order.external;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
public class MockMenuLookupService implements MenuLookupService {

    private static final Map<Long, MenuItemInfo> MENU_ITEMS = Map.of(
            101L, new MenuItemInfo(101L, "Margherita Pizza", new BigDecimal("1200"), 1L),
            102L, new MenuItemInfo(102L, "Pepperoni Pizza", new BigDecimal("1400"), 1L),
            103L, new MenuItemInfo(103L, "Garlic Bread", new BigDecimal("450"), 1L),
            201L, new MenuItemInfo(201L, "BBQ Chicken Pizza", new BigDecimal("1500"), 3L),
            202L, new MenuItemInfo(202L, "Coke 500ml", new BigDecimal("250"), 3L)
    );

    @Override
    public MenuItemInfo getItem(Long menuItemId) {
        return MENU_ITEMS.get(menuItemId);
    }

    @Override
    public boolean isAvailable(Long menuItemId) {
        return MENU_ITEMS.containsKey(menuItemId);
    }
}
