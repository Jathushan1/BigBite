package com.example.BigBite.order.external;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class MockPromotionValidationService implements PromotionValidationService {

    private static final String PROMO_WELCOME10 = "WELCOME10";

    @Override
    public DiscountResult validate(String promoCode, BigDecimal subtotal) {
        if (promoCode == null || promoCode.trim().isEmpty()) {
            return new DiscountResult(false, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), "No promo code provided");
        }

        if (PROMO_WELCOME10.equalsIgnoreCase(promoCode.trim())) {
            BigDecimal safeSubtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
            BigDecimal discount = safeSubtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
            return new DiscountResult(true, discount, "Promo code WELCOME10 applied (10% discount)");
        }

        return new DiscountResult(false, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), "Invalid promo code");
    }
}
