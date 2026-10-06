package inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public class AddStockItemRequestDto {

    @NotBlank(message = "Item name is required")
    private String itemName;

    private String itemCode;

    private String category;

    @NotNull(message = "Initial quantity is required")
    @PositiveOrZero(message = "Initial quantity cannot be negative")
    private Double quantity = 0.0;

    @NotBlank(message = "Unit of measure is required (e.g. pcs, kg, liters)")
    private String unit = "pcs";

    @NotNull(message = "Minimum threshold is required")
    @PositiveOrZero(message = "Minimum threshold cannot be negative")
    private Double minimumThreshold = 10.0;

    @PositiveOrZero(message = "Cost per unit cannot be negative")
    private BigDecimal costPerUnit;

    private String supplier;

    public AddStockItemRequestDto() {}

    public AddStockItemRequestDto(String itemName, String itemCode, String category, Double quantity,
                                  String unit, Double minimumThreshold, BigDecimal costPerUnit, String supplier) {
        this.itemName = itemName;
        this.itemCode = itemCode;
        this.category = category;
        this.quantity = quantity;
        this.unit = unit;
        this.minimumThreshold = minimumThreshold;
        this.costPerUnit = costPerUnit;
        this.supplier = supplier;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getMinimumThreshold() {
        return minimumThreshold;
    }

    public void setMinimumThreshold(Double minimumThreshold) {
        this.minimumThreshold = minimumThreshold;
    }

    public BigDecimal getCostPerUnit() {
        return costPerUnit;
    }

    public void setCostPerUnit(BigDecimal costPerUnit) {
        this.costPerUnit = costPerUnit;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }
}
