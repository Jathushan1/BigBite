package com.example.BigBite.order.dto.request;

import com.example.BigBite.order.enums.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class OrderStatusUpdateRequestDto {

    @NotNull(message = "status is required")
    private OrderStatus status;
    private Long riderId;
    private String note;

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

    public Long getRiderId() { return riderId; }
    public void setRiderId(Long riderId) { this.riderId = riderId; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
