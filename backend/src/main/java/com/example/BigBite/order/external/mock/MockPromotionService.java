package com.example.BigBite.order.external.mock;

import com.example.BigBite.order.external.PromotionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Stand-in for the promotions module: only WELCOME10 (10% off the subtotal) is valid. */
@Component
public class MockPromotionService implements PromotionService {

    private static final Logger log = LoggerFactory.getLogger(MockPromotionService.class);
    private static final String PROMO_WELCOME10 = "WELCOME10";

    @Override
    public BigDecimal calculateDiscount(String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("No promo code provided");
        }
        if (!PROMO_WELCOME10.equalsIgnoreCase(code.trim())) {
            throw new IllegalArgumentException("Invalid promo code");
        }
        BigDecimal safeSubtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        return safeSubtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public void reserveRedemption(Long orderId, String code, Long customerId) {
        log.debug("[mock-promotion] reserved {} for order {}", code, orderId);
    }

    @Override
    public void releaseRedemption(Long orderId) {
        log.debug("[mock-promotion] released redemption for order {}", orderId);
    }
}
