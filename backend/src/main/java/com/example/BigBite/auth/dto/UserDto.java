package com.example.BigBite.auth.dto;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserStatus;

import java.time.LocalDateTime;

public class UserDto {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private Long branchId;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private Long approvedBy;
    private String rejectionReason;

    public UserDto() {}

    public UserDto(Long id, String name, String email, Role role, UserStatus status, Long branchId, LocalDateTime createdAt, LocalDateTime approvedAt, Long approvedBy, String rejectionReason) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.branchId = branchId;
        this.createdAt = createdAt;
        this.approvedAt = approvedAt;
        this.approvedBy = approvedBy;
        this.rejectionReason = rejectionReason;
    }

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return new UserDto(
            user.getId(),
            user.getName(),
            user.getEmail(),
            user.getRole(),
            user.getStatus(),
            user.getBranchId(),
            user.getCreatedAt(),
            user.getApprovedAt(),
            user.getApprovedBy(),
            user.getRejectionReason()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }

    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
