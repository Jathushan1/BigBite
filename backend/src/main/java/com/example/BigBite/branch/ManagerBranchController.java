package com.example.BigBite.branch;

import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.branch.dto.BranchDto;
import com.example.BigBite.branch.dto.ManagerBranchUpdateDto;
import com.example.BigBite.branch.dto.MonthlyBranchSalesReportDto;
import com.example.BigBite.common.exception.ApiException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/** The branch manager's own branch: details, trading hours, ordering flags and sales. */
@RestController
@RequestMapping("/api/manager/branch")
@PreAuthorize("hasRole('BRANCH_MANAGER')")
public class ManagerBranchController {

    private final BranchService branchService;
    private final UserRepository userRepository;

    public ManagerBranchController(BranchService branchService, UserRepository userRepository) {
        this.branchService = branchService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<BranchDto> getMyBranch(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(branchService.getBranchById(requireBranchId(principal)));
    }

    @PutMapping
    public ResponseEntity<BranchDto> updateMyBranch(@AuthenticationPrincipal UserDetails principal,
                                                    @Valid @RequestBody ManagerBranchUpdateDto request) {
        return ResponseEntity.ok(branchService.updateBranchAsManager(requireBranchId(principal), request));
    }

    @GetMapping("/reports/monthly")
    public ResponseEntity<MonthlyBranchSalesReportDto> getMyMonthlyReport(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        LocalDate today = LocalDate.now();
        return ResponseEntity.ok(branchService.generateBranchMonthlySalesReport(requireBranchId(principal),
                year != null ? year : today.getYear(), month != null ? month : today.getMonthValue()));
    }

    private Long requireBranchId(UserDetails principal) {
        User manager = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign in again"));
        if (manager.getStatus() != UserStatus.APPROVED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE", "Your manager account is not approved");
        }
        if (manager.getBranchId() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "BRANCH_NOT_ASSIGNED",
                    "The Super Admin has not assigned you to a branch yet");
        }
        return manager.getBranchId();
    }
}
