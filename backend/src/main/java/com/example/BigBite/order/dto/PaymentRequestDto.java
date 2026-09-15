package com.example.BigBite.order.dto;

import com.example.BigBite.order.PaymentMethod;

public class PaymentRequestDto {

    private PaymentMethod paymentMethod = PaymentMethod.CARD_STRIPE;
    private String stripePaymentIntentId;
    private boolean success = true;

    public PaymentRequestDto() {
    }

    public PaymentRequestDto(boolean success) {
        this.success = success;
    }

    public PaymentRequestDto(PaymentMethod paymentMethod, boolean success) {
        this.paymentMethod = paymentMethod;
        this.success = success;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getStripePaymentIntentId() {
        return stripePaymentIntentId;
    }

    public void setStripePaymentIntentId(String stripePaymentIntentId) {
        this.stripePaymentIntentId = stripePaymentIntentId;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
}
