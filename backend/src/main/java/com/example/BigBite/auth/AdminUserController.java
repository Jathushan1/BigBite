package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AssignBranchRequestDto;
import com.example.BigBite.auth.dto.RejectUserRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping("/pending")
    public ResponseEntity<List<UserDto>> getPendingUsers() {
        return ResponseEntity.ok(adminUserService.getPendingUsers());
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<UserDto> approveUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String superAdminEmail = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(adminUserService.approveUser(id, superAdminEmail));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<UserDto> rejectUser(
            @PathVariable Long id,
            @RequestBody(required = false) RejectUserRequestDto request) {
        return ResponseEntity.ok(adminUserService.rejectUser(id, request));
    }

    @PutMapping("/{id}/assign-branch")
    public ResponseEntity<UserDto> assignBranch(
            @PathVariable Long id,
            @Valid @RequestBody AssignBranchRequestDto request) {
        return ResponseEntity.ok(adminUserService.assignBranch(id, request));
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status) {
        return ResponseEntity.ok(adminUserService.getUsers(role, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminUserService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
