package inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class RecipeIngredientLinkDto {

    @NotNull(message = "Menu item ID is required")
    private Long menuItemId;

    @NotNull(message = "Inventory item ID is required")
    private Long inventoryItemId;

    @NotNull(message = "Quantity required is required")
    @Positive(message = "Quantity required must be strictly greater than zero")
    private Double quantityRequired;

    private String unit;

    public RecipeIngredientLinkDto() {}

    public RecipeIngredientLinkDto(Long menuItemId, Long inventoryItemId, Double quantityRequired, String unit) {
        this.menuItemId = menuItemId;
        this.inventoryItemId = inventoryItemId;
        this.quantityRequired = quantityRequired;
        this.unit = unit;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Long getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Long inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public Double getQuantityRequired() {
        return quantityRequired;
    }

    public void setQuantityRequired(Double quantityRequired) {
        this.quantityRequired = quantityRequired;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }
}
