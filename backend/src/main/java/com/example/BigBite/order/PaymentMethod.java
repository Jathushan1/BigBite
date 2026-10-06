package com.example.BigBite.order;

public enum PaymentMethod {
    CASH_ON_DELIVERY,
    CREDIT_CARD,
    DEBIT_CARD,
    // Keep historical rows and older API clients readable.
    CARD_STRIPE
}
