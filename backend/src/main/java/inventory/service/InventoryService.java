package inventory.service;

import com.example.BigBite.auth.User;
import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.inventory.dto.*;
import com.example.BigBite.inventory.entity.*;
import com.example.BigBite.inventory.exception.InsufficientStockException;
import com.example.BigBite.inventory.exception.ItemDiscontinuedException;
import com.example.BigBite.inventory.repository.InventoryItemRepository;
import com.example.BigBite.inventory.repository.InventoryTransactionRepository;
import com.example.BigBite.inventory.repository.MenuItemIngredientRepository;
import com.example.BigBite.inventory.security.InventoryAccessGuard;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final InventoryTransactionRepository inventoryTransactionRepository;
    private final MenuItemIngredientRepository menuItemIngredientRepository;
    private final BranchRepository branchRepository;
    private final InventoryAccessGuard accessGuard;

    public InventoryService(InventoryItemRepository inventoryItemRepository,
                            InventoryTransactionRepository inventoryTransactionRepository,
                            MenuItemIngredientRepository menuItemIngredientRepository,
                            BranchRepository branchRepository,
                            InventoryAccessGuard accessGuard) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.inventoryTransactionRepository = inventoryTransactionRepository;
        this.menuItemIngredientRepository = menuItemIngredientRepository;
        this.branchRepository = branchRepository;
        this.accessGuard = accessGuard;
    }

    /**
     * Requirement 1: Add Stock Item – Registers a new ingredient/inventory item for a branch.
     */
    @Transactional
    public InventoryItemResponseDto addStockItem(Long branchId, AddStockItemRequestDto request) {
        accessGuard.requireManageAccess(branchId);

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + branchId));

        if (inventoryItemRepository.existsByBranchIdAndItemNameIgnoreCaseAndIsDiscontinuedFalse(branchId, request.getItemName().trim())) {
            throw new IllegalArgumentException("An active inventory item named '" + request.getItemName().trim() + "' already exists for this branch");
        }

        String itemCode = request.getItemCode();
        if (itemCode == null || itemCode.trim().isEmpty()) {
            itemCode = "SKU-" + branch.getBranchCode() + "-" + System.currentTimeMillis() % 100000;
        } else {
            itemCode = itemCode.trim().toUpperCase();
            if (inventoryItemRepository.existsByBranchIdAndItemCodeIgnoreCase(branchId, itemCode)) {
                throw new IllegalArgumentException("An inventory item with code '" + itemCode + "' already exists for this branch");
            }
        }

        InventoryItem item = new InventoryItem(
                branch,
                request.getItemName().trim(),
                itemCode,
                request.getCategory() != null ? request.getCategory().trim() : "General",
                request.getQuantity() != null ? request.getQuantity() : 0.0,
                request.getUnit() != null ? request.getUnit().trim() : "pcs",
                request.getMinimumThreshold() != null ? request.getMinimumThreshold() : 10.0,
                request.getCostPerUnit(),
                request.getSupplier()
        );

        InventoryItem saved = inventoryItemRepository.save(item);

        User currentUser = accessGuard.getCurrentUser();
        InventoryTransaction tx = new InventoryTransaction(
                saved,
                branchId,
                TransactionType.INITIAL_STOCK,
                saved.getQuantity(),
                0.0,
                saved.getQuantity(),
                null,
                "Initial inventory registration",
                currentUser.getName() + " (" + currentUser.getRole() + ")"
        );
        inventoryTransactionRepository.save(tx);

        return InventoryItemResponseDto.fromEntity(saved);
    }

    /**
     * Requirement 2: View Stock Levels – Displays current quantities of all tracked inventory items.
     */
    @Transactional(readOnly = true)
    public List<InventoryItemResponseDto> getStockLevels(Long branchId, boolean includeDiscontinued) {
        accessGuard.requireManageAccess(branchId);
        validateBranchExists(branchId);

        List<InventoryItem> items = includeDiscontinued
                ? inventoryItemRepository.findByBranchId(branchId)
                : inventoryItemRepository.findByBranchIdAndIsDiscontinuedFalse(branchId);

        return items.stream()
                .map(InventoryItemResponseDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponseDto> getLowStockItems(Long branchId) {
        accessGuard.requireManageAccess(branchId);
        validateBranchExists(branchId);

        return inventoryItemRepository.findLowStockItemsByBranchId(branchId).stream()
                .map(InventoryItemResponseDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public StockSummaryDto getStockSummary(Long branchId) {
        accessGuard.requireManageAccess(branchId);
        validateBranchExists(branchId);

        List<InventoryItem> all = inventoryItemRepository.findByBranchId(branchId);
        long totalTracked = 0;
        double totalQuantity = 0.0;
        long lowStockCount = 0;
        long outOfStockCount = 0;
        long discontinuedCount = 0;
        BigDecimal valuation = BigDecimal.ZERO;

        for (InventoryItem item : all) {
            if (item.isDiscontinued()) {
                discontinuedCount++;
                continue;
            }
            totalTracked++;
            double q = item.getQuantity() != null ? item.getQuantity() : 0.0;
            totalQuantity += q;

            if (q <= 0.0) {
                outOfStockCount++;
            } else if (q <= (item.getMinimumThreshold() != null ? item.getMinimumThreshold() : 0.0)) {
                lowStockCount++;
            }

            if (item.getCostPerUnit() != null) {
                valuation = valuation.add(item.getCostPerUnit().multiply(BigDecimal.valueOf(q)));
            }
        }

        return new StockSummaryDto(branchId, totalTracked, totalQuantity, lowStockCount, outOfStockCount, discontinuedCount, valuation);
    }

    @Transactional(readOnly = true)
    public InventoryItemResponseDto getItemById(Long branchId, Long itemId) {
        accessGuard.requireManageAccess(branchId);
        InventoryItem item = findItemInBranch(branchId, itemId);
        return InventoryItemResponseDto.fromEntity(item);
    }

    /**
     * Requirement 3: Update Stock (Restock) – Allows manual replenishment of inventory quantities.
     */
    @Transactional
    public InventoryItemResponseDto restockItem(Long branchId, Long itemId, RestockRequestDto request) {
        accessGuard.requireManageAccess(branchId);
        InventoryItem item = findItemInBranch(branchId, itemId);

        if (item.isDiscontinued()) {
            throw new ItemDiscontinuedException(itemId, item.getItemName());
        }

        double previousQty = item.getQuantity();
        item.restock(request.getQuantityToAdd());

        if (request.getCostPerUnit() != null) {
            item.setCostPerUnit(request.getCostPerUnit());
        }
        if (request.getSupplier() != null && !request.getSupplier().isBlank()) {
            item.setSupplier(request.getSupplier().trim());
        }

        InventoryItem saved = inventoryItemRepository.save(item);

        User currentUser = accessGuard.getCurrentUser();
        InventoryTransaction tx = new InventoryTransaction(
                saved,
                branchId,
                TransactionType.RESTOCK,
                request.getQuantityToAdd(),
                previousQty,
                saved.getQuantity(),
                null,
                request.getRemarks() != null ? request.getRemarks() : "Manual restock replenishment",
                currentUser.getName() + " (" + currentUser.getRole() + ")"
        );
        inventoryTransactionRepository.save(tx);

        return InventoryItemResponseDto.fromEntity(saved);
    }

    /**
     * Deduct stock for a single item.
     */
    @Transactional
    public InventoryItemResponseDto deductStock(Long branchId, Long itemId, DeductStockRequestDto request) {
        accessGuard.requireManageAccess(branchId);
        InventoryItem item = findItemInBranch(branchId, itemId);

        if (item.isDiscontinued()) {
            throw new ItemDiscontinuedException(itemId, item.getItemName());
        }

        double qtyToDeduct = request.getQuantityToDeduct();
        if (item.getQuantity() < qtyToDeduct) {
            throw new InsufficientStockException(item.getItemName(), item.getQuantity(), qtyToDeduct, item.getUnit());
        }

        double previousQty = item.getQuantity();
        item.deduct(qtyToDeduct);
        InventoryItem saved = inventoryItemRepository.save(item);

        User currentUser = accessGuard.getCurrentUser();
        InventoryTransaction tx = new InventoryTransaction(
                saved,
                branchId,
                TransactionType.ORDER_DEDUCTION,
                -qtyToDeduct,
                previousQty,
                saved.getQuantity(),
                request.getOrderNumber(),
                request.getReason() != null ? request.getReason() : "Direct stock deduction",
                currentUser.getName() + " (" + currentUser.getRole() + ")"
        );
        inventoryTransactionRepository.save(tx);

        return InventoryItemResponseDto.fromEntity(saved);
    }

    /**
     * Requirement 4: Automatic Stock Deduction – Reduces stock levels automatically when a related order is placed.
     * Takes an order with items and deducts corresponding ingredient quantities atomically.
     */
    @Transactional
    public List<InventoryItemResponseDto> deductStockForOrder(Long branchId, OrderDeductionRequestDto request) {
        accessGuard.requireManageAccess(branchId);
        validateBranchExists(branchId);

        String orderNo = request.getOrderNumber();
        if (orderNo == null || orderNo.isBlank()) {
            orderNo = "ORD-DED-" + System.currentTimeMillis();
        }

        // Map aggregated deductions to avoid multiple checks on same item in one order
        Map<Long, Double> deductions = new LinkedHashMap<>();

        for (OrderDeductionItemDto itemDto : request.getItems()) {
            Double reqQty = itemDto.getQuantity() != null ? itemDto.getQuantity() : 1.0;
            if (reqQty <= 0) continue;

            if (itemDto.getInventoryItemId() != null) {
                deductions.merge(itemDto.getInventoryItemId(), reqQty, Double::sum);
            } else if (itemDto.getMenuItemId() != null) {
                // Look up recipe ingredients for this menu item
                List<MenuItemIngredient> ingredients = menuItemIngredientRepository.findByMenuItemId(itemDto.getMenuItemId());
                if (!ingredients.isEmpty()) {
                    for (MenuItemIngredient ing : ingredients) {
                        double totalIngQty = ing.getQuantityRequired() * reqQty;
                        deductions.merge(ing.getInventoryItem().getId(), totalIngQty, Double::sum);
                    }
                } else if (itemDto.getItemName() != null) {
                    // Fallback to name matching
                    resolveByNameAndMerge(branchId, itemDto.getItemName(), reqQty, deductions);
                }
            } else if (itemDto.getItemName() != null) {
                resolveByNameAndMerge(branchId, itemDto.getItemName(), reqQty, deductions);
            }
        }

        if (deductions.isEmpty()) {
            throw new IllegalArgumentException("No matching inventory items found to deduct for this order");
        }

        // First pass: Verify stock sufficiency for ALL items (all-or-nothing check)
        List<InventoryItem> itemsToUpdate = new ArrayList<>();
        for (Map.Entry<Long, Double> entry : deductions.entrySet()) {
            InventoryItem item = findItemInBranch(branchId, entry.getKey());
            if (item.isDiscontinued()) {
                throw new ItemDiscontinuedException(item.getId(), item.getItemName());
            }
            if (item.getQuantity() < entry.getValue()) {
                throw new InsufficientStockException(item.getItemName(), item.getQuantity(), entry.getValue(), item.getUnit());
            }
            itemsToUpdate.add(item);
        }

        // Second pass: Perform deductions and record transactions
        User currentUser = accessGuard.getCurrentUser();
        List<InventoryItemResponseDto> result = new ArrayList<>();

        for (InventoryItem item : itemsToUpdate) {
            double deductQty = deductions.get(item.getId());
            double previousQty = item.getQuantity();
            item.deduct(deductQty);
            InventoryItem saved = inventoryItemRepository.save(item);

            InventoryTransaction tx = new InventoryTransaction(
                    saved,
                    branchId,
                    TransactionType.ORDER_DEDUCTION,
                    -deductQty,
                    previousQty,
                    saved.getQuantity(),
                    orderNo,
                    "Automatic stock deduction for order #" + orderNo + (request.getNotes() != null ? " (" + request.getNotes() + ")" : ""),
                    currentUser.getName() + " (" + currentUser.getRole() + ")"
            );
            inventoryTransactionRepository.save(tx);

            result.add(InventoryItemResponseDto.fromEntity(saved));
        }

        return result;
    }

    /**
     * Automatic stock deduction based on menu items ordered.
     */
    @Transactional
    public List<InventoryItemResponseDto> deductStockForMenuItems(Long branchId, String orderNumber, List<MenuItemOrderDto> orders) {
        List<OrderDeductionItemDto> items = new ArrayList<>();
        for (MenuItemOrderDto o : orders) {
            items.add(new OrderDeductionItemDto(null, o.getMenuItemId(), null, Double.valueOf(o.getQuantity())));
        }
        OrderDeductionRequestDto req = new OrderDeductionRequestDto(orderNumber, items, "Menu item order fulfillment");
        return deductStockForOrder(branchId, req);
    }

    /**
     * Requirement 5: Discontinue Stock Item – Removes an inventory item that is no longer used or tracked.
     */
    @Transactional
    public InventoryItemResponseDto discontinueStockItem(Long branchId, Long itemId) {
        accessGuard.requireManageAccess(branchId);
        InventoryItem item = findItemInBranch(branchId, itemId);

        if (item.isDiscontinued()) {
            return InventoryItemResponseDto.fromEntity(item);
        }

        item.discontinue();
        InventoryItem saved = inventoryItemRepository.save(item);

        User currentUser = accessGuard.getCurrentUser();
        InventoryTransaction tx = new InventoryTransaction(
                saved,
                branchId,
                TransactionType.DISCONTINUED,
                0.0,
                saved.getQuantity(),
                saved.getQuantity(),
                null,
                "Item discontinued and removed from active tracking",
                currentUser.getName() + " (" + currentUser.getRole() + ")"
        );
        inventoryTransactionRepository.save(tx);

        return InventoryItemResponseDto.fromEntity(saved);
    }

    /**
     * Reactivate a previously discontinued item.
     */
    @Transactional
    public InventoryItemResponseDto reactivateStockItem(Long branchId, Long itemId) {
        accessGuard.requireManageAccess(branchId);
        InventoryItem item = findItemInBranch(branchId, itemId);

        item.reactivate();
        InventoryItem saved = inventoryItemRepository.save(item);

        User currentUser = accessGuard.getCurrentUser();
        InventoryTransaction tx = new InventoryTransaction(
                saved,
                branchId,
                TransactionType.REACTIVATED,
                0.0,
                saved.getQuantity(),
                saved.getQuantity(),
                null,
                "Item reactivated for active tracking",
                currentUser.getName() + " (" + currentUser.getRole() + ")"
        );
        inventoryTransactionRepository.save(tx);

        return InventoryItemResponseDto.fromEntity(saved);
    }

    /**
     * Recipe ingredient mapping support.
     */
    @Transactional
    public MenuItemIngredientResponseDto linkMenuItemIngredient(Long branchId, RecipeIngredientLinkDto request) {
        accessGuard.requireManageAccess(branchId);
        InventoryItem item = findItemInBranch(branchId, request.getInventoryItemId());

        Optional<MenuItemIngredient> existing = menuItemIngredientRepository
                .findByMenuItemIdAndInventoryItemId(request.getMenuItemId(), request.getInventoryItemId());

        MenuItemIngredient link;
        if (existing.isPresent()) {
            link = existing.get();
            link.setQuantityRequired(request.getQuantityRequired());
            if (request.getUnit() != null) link.setUnit(request.getUnit());
        } else {
            link = new MenuItemIngredient(
                    request.getMenuItemId(),
                    item,
                    request.getQuantityRequired(),
                    request.getUnit() != null ? request.getUnit() : item.getUnit()
            );
        }

        MenuItemIngredient saved = menuItemIngredientRepository.save(link);
        return MenuItemIngredientResponseDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<MenuItemIngredientResponseDto> getRecipeIngredients(Long branchId, Long menuItemId) {
        accessGuard.requireManageAccess(branchId);
        return menuItemIngredientRepository.findByMenuItemId(menuItemId).stream()
                .map(MenuItemIngredientResponseDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InventoryTransactionResponseDto> getTransactionHistory(Long branchId, Long itemId) {
        accessGuard.requireManageAccess(branchId);
        if (itemId != null) {
            findItemInBranch(branchId, itemId);
            return inventoryTransactionRepository.findByInventoryItemIdOrderByTimestampDesc(itemId).stream()
                    .map(InventoryTransactionResponseDto::fromEntity)
                    .toList();
        }
        return inventoryTransactionRepository.findByBranchIdOrderByTimestampDesc(branchId).stream()
                .map(InventoryTransactionResponseDto::fromEntity)
                .toList();
    }

    private void resolveByNameAndMerge(Long branchId, String name, Double qty, Map<Long, Double> deductions) {
        Optional<InventoryItem> match = inventoryItemRepository.findByBranchIdAndItemNameIgnoreCaseAndIsDiscontinuedFalse(branchId, name.trim());
        if (match.isPresent()) {
            deductions.merge(match.get().getId(), qty, Double::sum);
        } else {
            throw new ResourceNotFoundException("No active inventory item found matching name: " + name);
        }
    }

    private InventoryItem findItemInBranch(Long branchId, Long itemId) {
        return inventoryItemRepository.findByIdAndBranchId(itemId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found with id " + itemId + " in branch " + branchId));
    }

    private void validateBranchExists(Long branchId) {
        if (!branchRepository.existsById(branchId)) {
            throw new ResourceNotFoundException("Branch not found with id: " + branchId);
        }
    }
}
