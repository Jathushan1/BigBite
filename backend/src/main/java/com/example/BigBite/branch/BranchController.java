package com.example.BigBite.branch;

import com.example.BigBite.branch.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/branches")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    /**
     * Add a new branch
     */
    @PostMapping
    public ResponseEntity<BranchDto> createBranch(@Valid @RequestBody CreateBranchRequestDto request) {
        BranchDto created = branchService.createBranch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * View all branches (optionally filtered by status)
     */
    @GetMapping
    public ResponseEntity<List<BranchDto>> getBranches(@RequestParam(required = false) BranchStatus status) {
        return ResponseEntity.ok(branchService.getAllBranches(status));
    }

    /**
     * View all active branches
     */
    @GetMapping("/active")
    public ResponseEntity<List<BranchDto>> getActiveBranches() {
        return ResponseEntity.ok(branchService.getActiveBranches());
    }

    /**
     * View all inactive branches
     */
    @GetMapping("/inactive")
    public ResponseEntity<List<BranchDto>> getInactiveBranches() {
        return ResponseEntity.ok(branchService.getInactiveBranches());
    }

    /**
     * View a single branch by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<BranchDto> getBranchById(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.getBranchById(id));
    }

    /**
     * Edit / update an existing branch
     */
    @PutMapping("/{id}")
    public ResponseEntity<BranchDto> updateBranch(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBranchRequestDto request) {
        return ResponseEntity.ok(branchService.updateBranch(id, request));
    }

    /**
     * Deactivate a branch
     */
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<BranchDto> deactivateBranchViaPut(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.deactivateBranch(id));
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<BranchDto> deactivateBranchViaPatch(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.deactivateBranch(id));
    }

    /**
     * Activate a branch
     */
    @PutMapping("/{id}/activate")
    public ResponseEntity<BranchDto> activateBranchViaPut(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.activateBranch(id));
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<BranchDto> activateBranchViaPatch(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.activateBranch(id));
    }

    /**
     * Delete a branch
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBranch(@PathVariable Long id) {
        branchService.deleteBranch(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Record a sale / order for a branch
     */
    @PostMapping("/{id}/sales")
    public ResponseEntity<BranchSaleDto> recordSale(
            @PathVariable Long id,
            @Valid @RequestBody RecordSaleRequestDto request) {
        BranchSaleDto recorded = branchService.recordSale(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(recorded);
    }

    /**
     * Generate monthly sales report for a specific branch
     */
    @GetMapping("/{id}/reports/monthly")
    public ResponseEntity<MonthlyBranchSalesReportDto> getBranchMonthlySalesReport(
            @PathVariable Long id,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(branchService.generateBranchMonthlySalesReport(id, year, month));
    }

    /**
     * Generate monthly sales report across the whole franchise
     */
    @GetMapping("/reports/monthly")
    public ResponseEntity<FranchiseMonthlySalesReportDto> getFranchiseMonthlySalesReport(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(branchService.generateFranchiseMonthlySalesReport(year, month));
    }

    @GetMapping("/reports/franchise-monthly")
    public ResponseEntity<FranchiseMonthlySalesReportDto> getFranchiseMonthlySalesReportAlias(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(branchService.generateFranchiseMonthlySalesReport(year, month));
    }
}
