package com.example.BigBite.order.external;

import java.math.BigDecimal;

public interface MenuLookupService {

    record MenuItemInfo(Long id, String name, BigDecimal price, Long branchId) {}

    MenuItemInfo getItem(Long menuItemId);

    boolean isAvailable(Long menuItemId);
}
