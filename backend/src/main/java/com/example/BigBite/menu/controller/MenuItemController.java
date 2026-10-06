package com.example.BigBite.menu.controller;

import com.example.BigBite.menu.dto.MenuItemRequestDto;
import com.example.BigBite.menu.dto.MenuItemResponseDto;
import com.example.BigBite.menu.service.MenuItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
public class MenuItemController {

    private final MenuItemService menuItemService;

    public MenuItemController(MenuItemService menuItemService) {
        this.menuItemService = menuItemService;
    }

    @PostMapping("/branch/{branchId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<MenuItemResponseDto> createMenuItem(
            @PathVariable Long branchId,
            @Valid @RequestBody MenuItemRequestDto request) {
        MenuItemResponseDto created = menuItemService.createMenuItem(branchId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/branch/{branchId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<MenuItemResponseDto>> getMenuItemsByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(menuItemService.getMenuItemsByBranch(branchId));
    }

    @GetMapping("/{menuId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MenuItemResponseDto> getMenuItemById(@PathVariable Long menuId) {
        return ResponseEntity.ok(menuItemService.getMenuItemById(menuId));
    }

    @PutMapping("/{menuId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<MenuItemResponseDto> updateMenuItem(
            @PathVariable Long menuId,
            @Valid @RequestBody MenuItemRequestDto request) {
        return ResponseEntity.ok(menuItemService.updateMenuItem(menuId, request));
    }

    @DeleteMapping("/{menuId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable Long menuId) {
        menuItemService.deleteMenuItem(menuId);
        return ResponseEntity.noContent().build();
    }
}
