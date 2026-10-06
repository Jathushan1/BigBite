package com.bigbite.promotion;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class PromotionService {

    @Autowired
    private PromotionRepository promotionRepository;

    public List<Promotion> getAllPromotions() {
        return promotionRepository.findAll();
    }

    public List<Promotion> getPromotionsForBranch(Long branchId) {
        if (branchId == null) {
            return promotionRepository.findAll();
        }
        return promotionRepository.findByBranchIdOrBranchIdIsNull(branchId);
    }

    public Promotion getPromotion(Long id) {
        return promotionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + id));
    }

    public Promotion createPromotion(Promotion promo) {
        if (promo.getCode() == null || promo.getCode().isBlank()) {
            throw new IllegalArgumentException("Promo code is required.");
        }
        String code = promo.getCode().trim().toUpperCase();
        if (promotionRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new IllegalArgumentException("Promo code already exists: " + code);
        }
        promo.setCode(code);
        if (promo.getValue() == null || promo.getValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Valid discount value is required.");
        }
        if (promo.getStartDate() == null) promo.setStartDate(LocalDate.now());
        if (promo.getEndDate() == null) promo.setEndDate(LocalDate.now().plusMonths(3));
        return promotionRepository.save(promo);
    }

    public Promotion updatePromotion(Long id, Promotion updated) {
        Promotion promo = getPromotion(id);
        if (updated.getValue() != null && updated.getValue().compareTo(BigDecimal.ZERO) > 0) {
            promo.setValue(updated.getValue());
        }
        if (updated.getType() != null && !updated.getType().isBlank()) {
            promo.setType(updated.getType().toUpperCase().trim());
        }
        if (updated.getStartDate() != null) promo.setStartDate(updated.getStartDate());
        if (updated.getEndDate() != null) promo.setEndDate(updated.getEndDate());
        promo.setActive(updated.isActive());
        return promotionRepository.save(promo);
    }

    public void deletePromotion(Long id) {
        promotionRepository.deleteById(id);
    }

    public PromoValidationResult validatePromotion(String rawCode, Long branchId, BigDecimal subtotal) {
        if (rawCode == null || rawCode.isBlank()) {
            return new PromoValidationResult(false, BigDecimal.ZERO, "No promo code provided.", null);
        }
        String code = rawCode.trim().toUpperCase();
        Promotion promo = promotionRepository.findByCodeIgnoreCase(code).orElse(null);
        if (promo == null) {
            return new PromoValidationResult(false, BigDecimal.ZERO, "Invalid promo code: " + code, null);
        }

        if (!promo.isActive()) {
            return new PromoValidationResult(false, BigDecimal.ZERO, "This promo code is inactive.", null);
        }

        LocalDate today = LocalDate.now();
        if (today.isBefore(promo.getStartDate()) || today.isAfter(promo.getEndDate())) {
            return new PromoValidationResult(false, BigDecimal.ZERO, "This promo code has expired or is not yet active.", null);
        }

        if (promo.getBranchId() != null && !promo.getBranchId().equals(branchId)) {
            return new PromoValidationResult(false, BigDecimal.ZERO, "This promo code is not valid for this branch.", null);
        }

        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(promo.getType())) {
            discount = subtotal.multiply(promo.getValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
        } else {
            discount = promo.getValue();
        }

        // Cap discount so total doesn't become negative
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }

        discount = discount.setScale(2, RoundingMode.HALF_UP);
        return new PromoValidationResult(true, discount, "Promo code applied successfully!", promo.getCode());
    }

    public static class PromoValidationResult {
        private boolean valid;
        private BigDecimal discount;
        private String message;
        private String promoCode;

        public PromoValidationResult(boolean valid, BigDecimal discount, String message, String promoCode) {
            this.valid = valid;
            this.discount = discount;
            this.message = message;
            this.promoCode = promoCode;
        }

        public boolean isValid() { return valid; }
        public BigDecimal getDiscount() { return discount; }
        public String getMessage() { return message; }
        public String getPromoCode() { return promoCode; }
    }
}
