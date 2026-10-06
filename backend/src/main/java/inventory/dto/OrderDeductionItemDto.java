package inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class OrderDeductionItemDto {

    private Long inventoryItemId;

    private Long menuItemId;

    private String itemName;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be strictly greater than zero")
    private Double quantity = 1.0;

    public OrderDeductionItemDto() {}

    public OrderDeductionItemDto(Long inventoryItemId, Double quantity) {
        this.inventoryItemId = inventoryItemId;
        this.quantity = quantity;
    }

    public OrderDeductionItemDto(Long inventoryItemId, Long menuItemId, String itemName, Double quantity) {
        this.inventoryItemId = inventoryItemId;
        this.menuItemId = menuItemId;
        this.itemName = itemName;
        this.quantity = quantity;
    }

    public Long getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Long inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }
}
