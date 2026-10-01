package com.example.BigBite.order.external;

import java.math.BigDecimal;

/** Compatibility adapter for existing promotion providers. New integrations should implement PromotionService. */
public interface PromotionValidationService extends PromotionService {

    record DiscountResult(boolean valid, BigDecimal discountAmount, String message) {}

    DiscountResult validate(String promoCode, BigDecimal subtotal);

    @Override
    default BigDecimal calculateDiscount(String code, BigDecimal subtotal) {
        DiscountResult result = validate(code, subtotal);
        if (result == null || !result.valid() || result.discountAmount() == null) {
            throw new IllegalArgumentException(result != null ? result.message() : "Invalid promo code");
        }
        return result.discountAmount();
    }

    @Override default void reserveRedemption(Long orderId, String code, Long customerId) { }
    @Override default void releaseRedemption(Long orderId) { }
}
