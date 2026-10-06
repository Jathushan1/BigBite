package com.bigbite.promotion;

import com.bigbite.common.dto.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/promotions")
public class PromotionController {

    @Autowired
    private PromotionService promotionService;

    @GetMapping("/branch/{branchId}")
    public ResponseEntity<ApiResponse<List<Promotion>>> getBranchPromotions(@PathVariable Long branchId) {
        return ResponseEntity.ok(ApiResponse.ok(promotionService.getPromotionsForBranch(branchId)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Promotion>> createPromotion(@RequestBody Promotion promotion) {
        try {
            Promotion saved = promotionService.createPromotion(promotion);
            return ResponseEntity.ok(ApiResponse.ok("Promotion created successfully", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Promotion>> updatePromotion(@PathVariable Long id, @RequestBody Promotion promotion) {
        try {
            Promotion updated = promotionService.updatePromotion(id, promotion);
            return ResponseEntity.ok(ApiResponse.ok("Promotion updated successfully", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('BRANCH_MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> deletePromotion(@PathVariable Long id) {
        try {
            promotionService.deletePromotion(id);
            return ResponseEntity.ok(ApiResponse.ok("Promotion removed", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to delete promotion: " + e.getMessage()));
        }
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<PromotionService.PromoValidationResult>> validatePromo(@RequestBody Map<String, Object> payload) {
        String code = (String) payload.get("code");
        Long branchId = payload.get("branchId") != null ? Long.valueOf(payload.get("branchId").toString()) : null;
        BigDecimal subtotal = payload.get("subtotal") != null ? new BigDecimal(payload.get("subtotal").toString()) : BigDecimal.ZERO;

        PromotionService.PromoValidationResult result = promotionService.validatePromotion(code, branchId, subtotal);
        if (result.isValid()) {
            return ResponseEntity.ok(ApiResponse.ok(result.getMessage(), result));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error(result.getMessage()));
        }
    }
}
