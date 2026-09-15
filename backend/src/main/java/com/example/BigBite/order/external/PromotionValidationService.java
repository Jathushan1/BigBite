package com.example.BigBite.order.external;

import java.math.BigDecimal;

public interface PromotionValidationService {

    record DiscountResult(boolean valid, BigDecimal discountAmount, String message) {}

    DiscountResult validate(String promoCode, BigDecimal subtotal);
}
