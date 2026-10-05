package com.example.BigBite.menu.factory;

import com.example.BigBite.branch.Branch;
import com.example.BigBite.menu.dto.MenuItemRequestDto;
import com.example.BigBite.menu.entity.MenuItem;
import org.springframework.stereotype.Component;

import java.math.RoundingMode;

@Component
public class MenuItemFactory {

    public MenuItem createMenuItem(MenuItemRequestDto request, Branch branch) {
        if (request == null) {
            throw new IllegalArgumentException("Menu item data is required");
        }
        MenuItem menuItem = new MenuItem();
        applyRequest(menuItem, request);
        menuItem.setBranch(branch);
        return menuItem;
    }

    public void applyRequest(MenuItem menuItem, MenuItemRequestDto request) {
        menuItem.setMenuName(request.getMenuName().trim());
        menuItem.setCategory(request.getCategory() != null ? request.getCategory().trim() : null);
        menuItem.setDescription(request.getDescription());
        menuItem.setPrice(request.getPrice().setScale(2, RoundingMode.UNNECESSARY));
        menuItem.setPhoto(request.getPhoto());
        menuItem.setAvailability(request.isAvailability());
    }
}
