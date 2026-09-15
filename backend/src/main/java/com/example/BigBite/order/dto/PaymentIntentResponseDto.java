package com.example.BigBite.order.dto;

import java.math.BigDecimal;

public class PaymentIntentResponseDto {

    private String clientSecret;
    private String publishableKey;
    private Long orderId;
    private BigDecimal amount;
    private String currency;

    public PaymentIntentResponseDto() {
    }

    public PaymentIntentResponseDto(String clientSecret, String publishableKey, Long orderId, BigDecimal amount, String currency) {
        this.clientSecret = clientSecret;
        this.publishableKey = publishableKey;
        this.orderId = orderId;
        this.amount = amount;
        this.currency = currency;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public void setClientSecret(String clientSecret) {
        this.clientSecret = clientSecret;
    }

    public String getPublishableKey() {
        return publishableKey;
    }

    public void setPublishableKey(String publishableKey) {
        this.publishableKey = publishableKey;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }
}
