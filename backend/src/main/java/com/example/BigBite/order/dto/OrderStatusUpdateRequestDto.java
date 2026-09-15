package com.example.BigBite.order.dto;

import com.example.BigBite.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class OrderStatusUpdateRequestDto {

    @NotNull(message = "status is required")
    private OrderStatus status;

    public OrderStatusUpdateRequestDto() {
    }

    public OrderStatusUpdateRequestDto(OrderStatus status) {
        this.status = status;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }
}
