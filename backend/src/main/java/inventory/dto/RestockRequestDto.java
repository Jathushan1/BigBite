package inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public class RestockRequestDto {

    @NotNull(message = "Quantity to add is required")
    @Positive(message = "Quantity to add must be greater than zero")
    private Double quantityToAdd;

    @PositiveOrZero(message = "Cost per unit cannot be negative")
    private BigDecimal costPerUnit;

    private String supplier;

    private String remarks;

    public RestockRequestDto() {}

    public RestockRequestDto(Double quantityToAdd, BigDecimal costPerUnit, String supplier, String remarks) {
        this.quantityToAdd = quantityToAdd;
        this.costPerUnit = costPerUnit;
        this.supplier = supplier;
        this.remarks = remarks;
    }

    public Double getQuantityToAdd() {
        return quantityToAdd;
    }

    public void setQuantityToAdd(Double quantityToAdd) {
        this.quantityToAdd = quantityToAdd;
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

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
