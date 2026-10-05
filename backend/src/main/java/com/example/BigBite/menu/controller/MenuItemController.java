package com.example.BigBite.menu.controller;

import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.menu.service.MenuItemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin
public class MenuItemController {

    private final MenuItemService menuItemService;

    public MenuItemController(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    // Create Menu Item for a Branch
    @PostMapping("/branch/{branchId}")
    public ResponseEntity<?> createMenuItem(
            @PathVariable Long branchId,
            @RequestBody MenuItem menuItem) {

        MenuItem created;
        try {
            created = menuItemService.createMenuItem(branchId, menuItem);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }

        if (created == null) {
            return ResponseEntity.badRequest()
                    .body("Branch not found");
        }

        return ResponseEntity.ok(created);
    }

    // Get all Menu Items of a Branch
    @GetMapping("/branch/{branchId}")
    public ResponseEntity<List<MenuItem>> getMenuItemsByBranch(
            @PathVariable Long branchId) {

        return ResponseEntity.ok(
                menuItemService.getMenuItemsByBranch(branchId)
        );
    }

    // Get Menu Item by ID
    @GetMapping("/{menuId}")
    public ResponseEntity<?> getMenuItemById(
            @PathVariable Long menuId) {

        MenuItem menuItem =
                menuItemService.getMenuItemById(menuId);

        if (menuItem == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(menuItem);
    }

    // Update Menu Item
    @PutMapping("/{menuId}")
    public ResponseEntity<?> updateMenuItem(
            @PathVariable Long menuId,
            @RequestBody MenuItem details) {

        MenuItem updated;
        try {
            updated = menuItemService.updateMenuItem(menuId, details);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }

    // Delete Menu Item
    @DeleteMapping("/{menuId}")
    public ResponseEntity<?> deleteMenuItem(
            @PathVariable Long menuId) {

        boolean deleted =
                menuItemService.deleteMenuItem(menuId);

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(
                "Menu item deleted successfully"
        );
    }
}