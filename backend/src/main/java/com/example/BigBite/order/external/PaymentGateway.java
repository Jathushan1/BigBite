package com.example.BigBite.order.external;

import java.math.BigDecimal;

public interface PaymentGateway {
    record GatewayResult(boolean approved, String reference) {}
    GatewayResult charge(BigDecimal amount, boolean simulateSuccess, String idempotencyKey);
}
