package com.example.BigBite.order.dto;

public class PaymentRequestDto {

    private boolean success;

    public PaymentRequestDto() {
    }

    public PaymentRequestDto(boolean success) {
        this.success = success;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}
