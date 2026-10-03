package com.example.BigBite.controller;

import com.example.BigBite.common.ApiResponse;
import com.example.BigBite.model.Branch;
import com.example.BigBite.service.BranchService;
import com.example.BigBite.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired
    private BranchService branchService;

    @Autowired
    private BranchRepository branchRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Branch>>> getAllBranches() {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getAllBranches()));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<Branch>>> getActiveBranches() {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getActiveBranches()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Branch>> getBranch(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(branchService.getBranchById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Branch>> createBranch(@RequestBody Branch branch) {
        try {
            Branch saved = branchService.createBranch(branch);
            return ResponseEntity.ok(ApiResponse.ok("Branch created successfully", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Branch>> updateBranch(@PathVariable Long id, @RequestBody Branch branch) {
        try {
            Branch updated = branchService.updateBranch(id, branch);
            return ResponseEntity.ok(ApiResponse.ok("Branch updated successfully", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Branch>> toggleStatus(@PathVariable Long id) {
        try {
            Branch updated = branchService.toggleStatus(id);
            return ResponseEntity.ok(ApiResponse.ok("Branch status updated to " + updated.getStatus(), updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Admin Franchise Performance Dashboard
     * Summarized key metrics across all branches.
     * Note: Cross-module metrics (orders, inventory, menu items, riders) are stubbed
     * until those feature branches are merged into main.
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFranchiseDashboard() {
        List<Branch> allBranches = branchRepository.findAll();

        BigDecimal franchiseRevenue = BigDecimal.ZERO;
        long lowStockCount = 0;
        long totalRiders = 0;
        long totalOrders = 0;

        List<Map<String, Object>> branchSummaries = new ArrayList<>();
        for (Branch b : allBranches) {
            Map<String, Object> summary = new HashMap<>();
            summary.put("branchId", b.getId());
            summary.put("branchName", b.getName());
            summary.put("status", b.getStatus());
            summary.put("totalOrders", 0);
            summary.put("revenue", BigDecimal.ZERO);
            summary.put("lowStockCount", 0);
            summary.put("activeRiders", 0);
            summary.put("menuItemsCount", 0);
            branchSummaries.add(summary);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalBranches", allBranches.size());
        result.put("activeBranches", allBranches.stream().filter(b -> "ACTIVE".equalsIgnoreCase(b.getStatus())).count());
        result.put("totalOrders", totalOrders);
        result.put("franchiseRevenue", franchiseRevenue);
        result.put("lowStockAlerts", lowStockCount);
        result.put("totalRiders", totalRiders);
        result.put("branches", branchSummaries);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Admin & Manager Monthly Sales Reports.
     * Note: Order counts and revenue are stubbed until the order module is merged.
     */
    @GetMapping("/reports/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlySalesReport(
            @RequestParam(required = false) Long branchId) {
        Map<String, BigDecimal> monthlyTotals = new LinkedHashMap<>();
        Map<String, Integer> monthlyOrderCounts = new LinkedHashMap<>();

        Map<String, Object> report = new HashMap<>();
        report.put("branchId", branchId);
        report.put("monthlyRevenue", monthlyTotals);
        report.put("monthlyOrders", monthlyOrderCounts);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }
}
