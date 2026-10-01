package com.example.BigBite.order.external;

import java.math.BigDecimal;

public interface PromotionService {
    BigDecimal calculateDiscount(String code, BigDecimal subtotal);
    void reserveRedemption(Long orderId, String code, Long customerId);
    void releaseRedemption(Long orderId);
}
