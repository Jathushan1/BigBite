package com.example.BigBite.order.external;

import java.math.BigDecimal;

public interface RefundGateway {
    record RefundResult(boolean refunded, String reference) {}
    RefundResult refund(String paymentReference, BigDecimal amount);
}
