package com.example.BigBite.order.enums;

public enum PaymentMethod {
    CASH_ON_DELIVERY,
    CREDIT_CARD,
    DEBIT_CARD,
    // Keep historical rows and older API clients readable.
    CARD_STRIPE
}
