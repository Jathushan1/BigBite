package com.example.BigBite.menu.service;

import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.menu.repository.MenuItemRepository;
import com.example.BigBite.menu.strategy.MenuItemValidationStrategy;
import com.example.BigBite.menu.factory.MenuItemFactory;
import com.example.BigBite.menu.event.MenuItemChangedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final BranchRepository branchRepository;
    private final MenuItemValidationStrategy validationStrategy;
    private final MenuItemFactory menuItemFactory;
    private final ApplicationEventPublisher eventPublisher;

    public MenuItemService(MenuItemRepository menuItemRepository,
                           BranchRepository branchRepository,
                           MenuItemValidationStrategy validationStrategy,
                           MenuItemFactory menuItemFactory,
                           ApplicationEventPublisher eventPublisher) {
        this.menuItemRepository = menuItemRepository;
        this.branchRepository = branchRepository;
        this.validationStrategy = validationStrategy;
        this.menuItemFactory = menuItemFactory;
        this.eventPublisher = eventPublisher;
    }

    // Create Menu Item
    public MenuItem createMenuItem(Long branchId, MenuItem menuItem) {

        validationStrategy.validate(menuItem);

        // Factory Pattern: create a clean entity using only menu fields from the request.
        MenuItem newMenuItem = menuItemFactory.createMenuItem(menuItem);

        Branch branch = branchRepository.findById(branchId)
                .orElse(null);

        if (branch == null) {
            return null;
        }

        newMenuItem.setBranch(branch);

        MenuItem saved = menuItemRepository.save(newMenuItem);
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "created", saved.getMenuId(), saved.getMenuName()));
        return saved;
    }

    // Get all menu items of a branch
    public List<MenuItem> getMenuItemsByBranch(Long branchId) {
        return menuItemRepository.findByBranchId(branchId);
    }

    // Get menu item by ID
    public MenuItem getMenuItemById(Long menuId) {
        return menuItemRepository.findById(menuId)
                .orElse(null);
    }

    // Update Menu Item
    public MenuItem updateMenuItem(Long menuId, MenuItem details) {

        MenuItem menuItem = menuItemRepository.findById(menuId)
                .orElse(null);

        if (menuItem == null) {
            return null;
        }

        validationStrategy.validate(details);

        menuItem.setMenuName(details.getMenuName());
        menuItem.setCategory(details.getCategory());
        menuItem.setDescription(details.getDescription());
        menuItem.setPrice(details.getPrice());
        menuItem.setPhoto(details.getPhoto());
        menuItem.setAvailability(details.isAvailability());

        MenuItem saved = menuItemRepository.save(menuItem);
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "updated", saved.getMenuId(), saved.getMenuName()));
        return saved;
    }

    // Delete Menu Item
    public boolean deleteMenuItem(Long menuId) {

        if (!menuItemRepository.existsById(menuId)) {
            return false;
        }

        MenuItem menuItem = menuItemRepository.findById(menuId).orElse(null);
        String menuName = menuItem != null ? menuItem.getMenuName() : "Unknown";
        menuItemRepository.deleteById(menuId);
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "deleted", menuId, menuName));

        return true;
    }
}