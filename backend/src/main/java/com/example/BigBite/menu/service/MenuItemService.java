package com.example.BigBite.menu.service;

import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchStatus;
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
        requireActiveBranch(branch);

        MenuItem saved = menuItemRepository.save(menuItemFactory.createMenuItem(request, branch));
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "created", saved.getMenuId(), saved.getMenuName(), branchId, saved.isAvailability()));
        return MenuItemResponseDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponseDto> getMenuItemsByBranch(Long branchId) {
        return getMenuItemsByBranch(branchId, false);
    }

    @Transactional(readOnly = true)
    public List<MenuItemResponseDto> getMenuItemsByBranch(Long branchId, boolean availableOnly) {
        if (!branchRepository.existsById(branchId)) {
            throw new ResourceNotFoundException("Branch not found with id: " + branchId);
        }
        List<MenuItem> items = availableOnly
                ? menuItemRepository.findByBranchIdAndAvailabilityTrue(branchId)
                : menuItemRepository.findByBranchId(branchId);
        return items.stream()
                .sorted(java.util.Comparator.comparing((MenuItem item) -> item.getCategory() == null ? "" : item.getCategory())
                        .thenComparing(MenuItem::getMenuName))
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
        requireActiveBranch(menuItem.getBranch());
        validationStrategy.validate(request);

        menuItemFactory.applyRequest(menuItem, request);

        MenuItem saved = menuItemRepository.save(menuItem);
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "updated", saved.getMenuId(), saved.getMenuName(), saved.getBranch().getId(), saved.isAvailability()));
        return MenuItemResponseDto.fromEntity(saved);
    }

    @Transactional
    public void deleteMenuItem(Long menuId) {
        MenuItem menuItem = findMenuItem(menuId);
        accessGuard.requireManageAccess(menuItem.getBranch().getId());

        menuItemRepository.delete(menuItem);
        eventPublisher.publishEvent(new MenuItemChangedEvent(
                "deleted", menuId, menuItem.getMenuName(), menuItem.getBranch().getId(), false));
    }

    private void requireActiveBranch(Branch branch) {
        if (branch.getStatus() != BranchStatus.ACTIVE) {
            throw new IllegalStateException("Branch '" + branch.getName() + "' is inactive; activate it before changing its menu");
        }
    }

    private MenuItem findMenuItem(Long menuId) {
        return menuItemRepository.findById(menuId)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + menuId));
    }
}
