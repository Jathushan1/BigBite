package inventory.dto;

import com.example.BigBite.inventory.entity.MenuItemIngredient;

public class MenuItemIngredientResponseDto {

    private Long id;
    private Long menuItemId;
    private Long inventoryItemId;
    private String inventoryItemName;
    private String inventoryItemCode;
    private Double quantityRequired;
    private String unit;

    public MenuItemIngredientResponseDto() {}

    public static MenuItemIngredientResponseDto fromEntity(MenuItemIngredient link) {
        if (link == null) return null;
        MenuItemIngredientResponseDto dto = new MenuItemIngredientResponseDto();
        dto.setId(link.getId());
        dto.setMenuItemId(link.getMenuItemId());
        if (link.getInventoryItem() != null) {
            dto.setInventoryItemId(link.getInventoryItem().getId());
            dto.setInventoryItemName(link.getInventoryItem().getItemName());
            dto.setInventoryItemCode(link.getInventoryItem().getItemCode());
        }
        dto.setQuantityRequired(link.getQuantityRequired());
        dto.setUnit(link.getUnit());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getInventoryItemName() {
        return inventoryItemName;
    }

    public void setInventoryItemName(String inventoryItemName) {
        this.inventoryItemName = inventoryItemName;
    }

    public String getInventoryItemCode() {
        return inventoryItemCode;
    }

    public void setInventoryItemCode(String inventoryItemCode) {
        this.inventoryItemCode = inventoryItemCode;
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
