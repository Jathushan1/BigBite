package com.example.BigBite.order.external;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class MockRefundGateway implements RefundGateway {
    @Override
    public RefundResult refund(String paymentReference, BigDecimal amount) {
        return new RefundResult(true, "MOCK-REFUND-" + UUID.randomUUID());
    }
}
