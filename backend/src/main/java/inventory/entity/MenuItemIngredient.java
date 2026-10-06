package inventory.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "menu_item_ingredients")
public class MenuItemIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "menu_item_id", nullable = false)
    private Long menuItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "quantity_required", nullable = false)
    private Double quantityRequired = 1.0;

    @Column(name = "unit")
    private String unit;

    public MenuItemIngredient() {}

    public MenuItemIngredient(Long menuItemId, InventoryItem inventoryItem, Double quantityRequired, String unit) {
        this.menuItemId = menuItemId;
        this.inventoryItem = inventoryItem;
        this.quantityRequired = quantityRequired != null ? quantityRequired : 1.0;
        this.unit = unit != null ? unit : (inventoryItem != null ? inventoryItem.getUnit() : "pcs");
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

    public InventoryItem getInventoryItem() {
        return inventoryItem;
    }

    public void setInventoryItem(InventoryItem inventoryItem) {
        this.inventoryItem = inventoryItem;
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
