package com.example.BigBite.order.external;

import com.example.BigBite.branch.BranchStatus;
import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.menu.repository.MenuItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Order-module view of the real menu table; prices are read at order time and snapshotted on the order. */
@Service
@Transactional(readOnly = true)
public class JpaMenuLookupService implements MenuLookupService {

    private final MenuItemRepository menuItemRepository;

    public JpaMenuLookupService(MenuItemRepository menuItemRepository) {
        this.menuItemRepository = menuItemRepository;
    }

    @Override
    public MenuItemInfo getItem(Long menuItemId) {
        if (menuItemId == null) return null;
        return menuItemRepository.findById(menuItemId)
                .map(item -> new MenuItemInfo(item.getMenuId(), item.getMenuName(), item.getPrice(),
                        item.getBranch().getId()))
                .orElse(null);
    }

    @Override
    public boolean isAvailable(Long menuItemId) {
        if (menuItemId == null) return false;
        return menuItemRepository.findById(menuItemId)
                .map(this::isOrderable)
                .orElse(false);
    }

    private boolean isOrderable(MenuItem item) {
        return item.isAvailability() && item.getBranch().getStatus() == BranchStatus.ACTIVE;
    }
}
