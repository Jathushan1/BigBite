package com.example.BigBite.menu.service;

import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.menu.dto.MenuItemRequestDto;
import com.example.BigBite.menu.dto.MenuItemResponseDto;
import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.menu.event.MenuItemChangedEvent;
import com.example.BigBite.menu.factory.MenuItemFactory;
import com.example.BigBite.menu.repository.MenuItemRepository;
import com.example.BigBite.menu.security.MenuAccessGuard;
import com.example.BigBite.menu.strategy.MenuItemValidationStrategy;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final BranchRepository branchRepository;
    private final MenuItemValidationStrategy validationStrategy;
    private final MenuItemFactory menuItemFactory;
    private final MenuAccessGuard accessGuard;
    private final ApplicationEventPublisher eventPublisher;

    public MenuItemService(MenuItemRepository menuItemRepository,
                           BranchRepository branchRepository,
                           MenuItemValidationStrategy validationStrategy,
                           MenuItemFactory menuItemFactory,
                           MenuAccessGuard accessGuard,
                           ApplicationEventPublisher eventPublisher) {
        this.menuItemRepository = menuItemRepository;
        this.branchRepository = branchRepository;
        this.validationStrategy = validationStrategy;
        this.menuItemFactory = menuItemFactory;
        this.accessGuard = accessGuard;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public MenuItemResponseDto createMenuItem(Long branchId, MenuItemRequestDto request) {
        accessGuard.requireManageAccess(branchId);
        validationStrategy.validate(request);

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + branchId));

        MenuItem saved = menuItemRepository.save(menuItemFactory.createMenuItem(request, branch));
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "created", saved.getMenuId(), saved.getMenuName()));
        return MenuItemResponseDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponseDto> getMenuItemsByBranch(Long branchId) {
        if (!branchRepository.existsById(branchId)) {
            throw new ResourceNotFoundException("Branch not found with id: " + branchId);
        }
        return menuItemRepository.findByBranchId(branchId).stream()
                .map(MenuItemResponseDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public MenuItemResponseDto getMenuItemById(Long menuId) {
        return MenuItemResponseDto.fromEntity(findMenuItem(menuId));
    }

    @Transactional
    public MenuItemResponseDto updateMenuItem(Long menuId, MenuItemRequestDto request) {
        MenuItem menuItem = findMenuItem(menuId);
        accessGuard.requireManageAccess(menuItem.getBranch().getId());
        validationStrategy.validate(request);

        menuItemFactory.applyRequest(menuItem, request);

        MenuItem saved = menuItemRepository.save(menuItem);
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "updated", saved.getMenuId(), saved.getMenuName()));
        return MenuItemResponseDto.fromEntity(saved);
    }

    @Transactional
    public void deleteMenuItem(Long menuId) {
        MenuItem menuItem = findMenuItem(menuId);
        accessGuard.requireManageAccess(menuItem.getBranch().getId());

        menuItemRepository.delete(menuItem);
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "deleted", menuId, menuItem.getMenuName()));
    }

    private MenuItem findMenuItem(Long menuId) {
        return menuItemRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuId));
    }
}
