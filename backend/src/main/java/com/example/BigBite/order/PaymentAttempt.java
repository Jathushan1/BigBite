package com.example.BigBite.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_payment_attempts", indexes = @Index(name = "idx_order_payment_attempts_order", columnList = "order_id"))
public class PaymentAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "idempotency_key", nullable = false, unique = true, length = 100)
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private PaymentMethod method;

    @Column(name = "request_fingerprint", nullable = false, length = 64)
    private String requestFingerprint;

    @Column(name = "http_status", nullable = false)
    private int httpStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", nullable = false, length = 32)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false, length = 32)
    private OrderStatus orderStatus;

    @Column(name = "gateway_reference", length = 64)
    private String gatewayReference;

    @Column(name = "response_json", columnDefinition = "text")
    private String responseJson;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected PaymentAttempt() {}

    public PaymentAttempt(Long orderId, String idempotencyKey, PaymentMethod method,
                          String requestFingerprint, int httpStatus, PaymentStatus paymentStatus,
                          OrderStatus orderStatus, String gatewayReference) {
        this.orderId = orderId;
        this.idempotencyKey = idempotencyKey;
        this.method = method;
        this.requestFingerprint = requestFingerprint;
        this.httpStatus = httpStatus;
        this.paymentStatus = paymentStatus;
        this.orderStatus = orderStatus;
        this.gatewayReference = gatewayReference;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public PaymentMethod getMethod() { return method; }
    public String getRequestFingerprint() { return requestFingerprint; }
    public int getHttpStatus() { return httpStatus; }
    public PaymentStatus getPaymentStatus() { return paymentStatus; }
    public OrderStatus getOrderStatus() { return orderStatus; }
    public String getGatewayReference() { return gatewayReference; }
    public String getResponseJson() { return responseJson; }
    public void setResponseJson(String responseJson) { this.responseJson = responseJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
