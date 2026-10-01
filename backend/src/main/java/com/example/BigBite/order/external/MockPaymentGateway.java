package com.example.BigBite.order.external;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@Component
public class MockPaymentGateway implements PaymentGateway {
    @Override
    public GatewayResult charge(BigDecimal amount, boolean simulateSuccess, String idempotencyKey) {
        String reference = "MOCK-" + UUID.nameUUIDFromBytes(idempotencyKey.getBytes(StandardCharsets.UTF_8));
        return new GatewayResult(simulateSuccess, simulateSuccess ? reference : null);
    }
}
