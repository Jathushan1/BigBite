package com.example.BigBite.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateOrderItemRequestDto {

    @NotNull(message = "quantity is required")
    @Min(value = 0, message = "quantity must be 0 or greater (0 removes the item)")
    private Integer quantity;

    public UpdateOrderItemRequestDto() {
    }

    public UpdateOrderItemRequestDto(Integer quantity) {
        this.quantity = quantity;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
