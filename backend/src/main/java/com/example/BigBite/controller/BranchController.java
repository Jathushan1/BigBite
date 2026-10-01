package com.example.BigBite.controller;

import com.bigbite.common.dto.ApiResponse;
import com.bigbite.inventory.StockItem;
import com.bigbite.inventory.StockItemRepository;
import com.bigbite.menu.MenuItemRepository;
import com.bigbite.order.Order;
import com.bigbite.order.OrderRepository;
import com.bigbite.user.Role;
import com.bigbite.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/branches")
public class BranchController {

    @Autowired
    private BranchService branchService;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private StockItemRepository stockItemRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private UserRepository userRepository;

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
     * Summarized key metrics across all branches
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFranchiseDashboard() {
        List<Branch> allBranches = branchRepository.findAll();
        List<Order> allOrders = orderRepository.findAll();
        List<StockItem> allStock = stockItemRepository.findAll();

        BigDecimal franchiseRevenue = BigDecimal.ZERO;
        for (Order o : allOrders) {
            if (!"CANCELLED".equalsIgnoreCase(o.getStatus())) {
                franchiseRevenue = franchiseRevenue.add(o.getTotal());
            }
        }

        long lowStockCount = allStock.stream().filter(StockItem::isLowStock).count();
        long totalRiders = userRepository.findByRole(Role.ROLE_RIDER).size();

        List<Map<String, Object>> branchSummaries = new ArrayList<>();
        for (Branch b : allBranches) {
            List<Order> bOrders = orderRepository.findByBranchIdOrderByCreatedAtDesc(b.getId());
            BigDecimal bRev = bOrders.stream()
                    .filter(o -> !"CANCELLED".equalsIgnoreCase(o.getStatus()))
                    .map(Order::getTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long bLowStock = stockItemRepository.findByBranchIdAndDiscontinuedFalse(b.getId())
                    .stream().filter(StockItem::isLowStock).count();

            long bRiders = userRepository.findByBranchIdAndRole(b.getId(), Role.ROLE_RIDER).size();
            long bMenuItems = menuItemRepository.countByBranchId(b.getId());

            Map<String, Object> summary = new HashMap<>();
            summary.put("branchId", b.getId());
            summary.put("branchName", b.getName());
            summary.put("status", b.getStatus());
            summary.put("totalOrders", bOrders.size());
            summary.put("revenue", bRev);
            summary.put("lowStockCount", bLowStock);
            summary.put("activeRiders", bRiders);
            summary.put("menuItemsCount", bMenuItems);
            branchSummaries.add(summary);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("totalBranches", allBranches.size());
        result.put("activeBranches", allBranches.stream().filter(b -> "ACTIVE".equalsIgnoreCase(b.getStatus())).count());
        result.put("totalOrders", allOrders.size());
        result.put("franchiseRevenue", franchiseRevenue);
        result.put("lowStockAlerts", lowStockCount);
        result.put("totalRiders", totalRiders);
        result.put("branches", branchSummaries);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Admin & Manager Monthly Sales Reports
     */
    @GetMapping("/reports/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'BRANCH_MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlySalesReport(
            @RequestParam(required = false) Long branchId) {
        List<Order> orders = (branchId != null) ?
                orderRepository.findByBranchIdOrderByCreatedAtDesc(branchId) :
                orderRepository.findAll();

        Map<String, BigDecimal> monthlyTotals = new LinkedHashMap<>();
        Map<String, Integer> monthlyOrderCounts = new LinkedHashMap<>();
        DateTimeFormatter monthFmt = DateTimeFormatter.ofPattern("MMM yyyy");

        for (Order o : orders) {
            if (!"CANCELLED".equalsIgnoreCase(o.getStatus()) && o.getCreatedAt() != null) {
                String monthKey = o.getCreatedAt().format(monthFmt);
                monthlyTotals.put(monthKey, monthlyTotals.getOrDefault(monthKey, BigDecimal.ZERO).add(o.getTotal()));
                monthlyOrderCounts.put(monthKey, monthlyOrderCounts.getOrDefault(monthKey, 0) + 1);
            }
        }

        Map<String, Object> report = new HashMap<>();
        report.put("branchId", branchId);
        report.put("monthlyRevenue", monthlyTotals);
        report.put("monthlyOrders", monthlyOrderCounts);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }
}

