package inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class DeductStockRequestDto {

    @NotNull(message = "Quantity to deduct is required")
    @Positive(message = "Quantity to deduct must be greater than zero")
    private Double quantityToDeduct;

    private String orderNumber;

    private String reason;

    public DeductStockRequestDto() {}

    public DeductStockRequestDto(Double quantityToDeduct, String orderNumber, String reason) {
        this.quantityToDeduct = quantityToDeduct;
        this.orderNumber = orderNumber;
        this.reason = reason;
    }

    public Double getQuantityToDeduct() {
        return quantityToDeduct;
    }

    public void setQuantityToDeduct(Double quantityToDeduct) {
        this.quantityToDeduct = quantityToDeduct;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
