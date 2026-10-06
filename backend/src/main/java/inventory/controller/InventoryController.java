package inventory.controller;

import com.example.BigBite.inventory.dto.*;
import com.example.BigBite.inventory.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'BRANCH_MANAGER')")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Requirement 1: Add Stock Item – Registers a new ingredient/inventory item for a branch.
     */
    @PostMapping("/branch/{branchId}/items")
    public ResponseEntity<InventoryItemResponseDto> addStockItem(
            @PathVariable Long branchId,
            @Valid @RequestBody AddStockItemRequestDto request) {
        InventoryItemResponseDto created = inventoryService.addStockItem(branchId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Requirement 2: View Stock Levels – Displays current quantities of all tracked inventory items.
     */
    @GetMapping("/branch/{branchId}/items")
    public ResponseEntity<List<InventoryItemResponseDto>> getStockLevels(
            @PathVariable Long branchId,
            @RequestParam(defaultValue = "false") boolean includeDiscontinued) {
        return ResponseEntity.ok(inventoryService.getStockLevels(branchId, includeDiscontinued));
    }

    /**
     * View a single inventory item by ID.
     */
    @GetMapping("/branch/{branchId}/items/{itemId}")
    public ResponseEntity<InventoryItemResponseDto> getItemById(
            @PathVariable Long branchId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(inventoryService.getItemById(branchId, itemId));
    }

    /**
     * View items with low stock (quantity <= minimumThreshold).
     */
    @GetMapping("/branch/{branchId}/items/low-stock")
    public ResponseEntity<List<InventoryItemResponseDto>> getLowStockItems(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getLowStockItems(branchId));
    }

    /**
     * View inventory metrics summary for the branch.
     */
    @GetMapping("/branch/{branchId}/items/summary")
    public ResponseEntity<StockSummaryDto> getStockSummary(@PathVariable Long branchId) {
        return ResponseEntity.ok(inventoryService.getStockSummary(branchId));
    }

    /**
     * Requirement 3: Update Stock (Restock) – Allows manual replenishment of inventory quantities.
     */
    @PostMapping("/branch/{branchId}/items/{itemId}/restock")
    public ResponseEntity<InventoryItemResponseDto> restockItem(
            @PathVariable Long branchId,
            @PathVariable Long itemId,
            @Valid @RequestBody RestockRequestDto request) {
        return ResponseEntity.ok(inventoryService.restockItem(branchId, itemId, request));
    }

    /**
     * Deduct stock for an individual inventory item.
     */
    @PostMapping("/branch/{branchId}/items/{itemId}/deduct")
    public ResponseEntity<InventoryItemResponseDto> deductStock(
            @PathVariable Long branchId,
            @PathVariable Long itemId,
            @Valid @RequestBody DeductStockRequestDto request) {
        return ResponseEntity.ok(inventoryService.deductStock(branchId, itemId, request));
    }

    /**
     * Requirement 4: Automatic Stock Deduction – Reduces stock levels automatically when a related order is placed.
     */
    @PostMapping("/branch/{branchId}/orders/deduct")
    public ResponseEntity<List<InventoryItemResponseDto>> deductStockForOrder(
            @PathVariable Long branchId,
            @Valid @RequestBody OrderDeductionRequestDto request) {
        return ResponseEntity.ok(inventoryService.deductStockForOrder(branchId, request));
    }

    /**
     * Automatic stock deduction for a list of ordered menu items (using recipe mappings).
     */
    @PostMapping("/branch/{branchId}/orders/deduct-menu-items")
    public ResponseEntity<List<InventoryItemResponseDto>> deductStockForMenuItems(
            @PathVariable Long branchId,
            @RequestParam(required = false) String orderNumber,
            @Valid @RequestBody List<MenuItemOrderDto> orders) {
        return ResponseEntity.ok(inventoryService.deductStockForMenuItems(branchId, orderNumber, orders));
    }

    /**
     * Requirement 5: Discontinue Stock Item – Removes an inventory item that is no longer used or tracked.
     */
    @DeleteMapping("/branch/{branchId}/items/{itemId}")
    public ResponseEntity<InventoryItemResponseDto> deleteOrDiscontinueItem(
            @PathVariable Long branchId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(inventoryService.discontinueStockItem(branchId, itemId));
    }

    @PatchMapping("/branch/{branchId}/items/{itemId}/discontinue")
    public ResponseEntity<InventoryItemResponseDto> discontinueItemViaPatch(
            @PathVariable Long branchId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(inventoryService.discontinueStockItem(branchId, itemId));
    }

    /**
     * Reactivate a discontinued inventory item.
     */
    @PatchMapping("/branch/{branchId}/items/{itemId}/reactivate")
    public ResponseEntity<InventoryItemResponseDto> reactivateItem(
            @PathVariable Long branchId,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(inventoryService.reactivateStockItem(branchId, itemId));
    }

    /**
     * Configure recipe ingredient links between menu items and inventory stock.
     */
    @PostMapping("/branch/{branchId}/recipes")
    public ResponseEntity<MenuItemIngredientResponseDto> linkMenuItemIngredient(
            @PathVariable Long branchId,
            @Valid @RequestBody RecipeIngredientLinkDto request) {
        MenuItemIngredientResponseDto created = inventoryService.linkMenuItemIngredient(branchId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/branch/{branchId}/recipes/{menuItemId}")
    public ResponseEntity<List<MenuItemIngredientResponseDto>> getRecipeIngredients(
            @PathVariable Long branchId,
            @PathVariable Long menuItemId) {
        return ResponseEntity.ok(inventoryService.getRecipeIngredients(branchId, menuItemId));
    }

    /**
     * View transaction and audit log history.
     */
    @GetMapping("/branch/{branchId}/transactions")
    public ResponseEntity<List<InventoryTransactionResponseDto>> getTransactionHistory(
            @PathVariable Long branchId,
            @RequestParam(required = false) Long itemId) {
        return ResponseEntity.ok(inventoryService.getTransactionHistory(branchId, itemId));
    }
}
