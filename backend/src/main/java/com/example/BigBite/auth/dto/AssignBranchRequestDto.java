package com.example.BigBite.auth.dto;

import jakarta.validation.constraints.NotNull;

public class AssignBranchRequestDto {

    @NotNull(message = "Branch ID is required")
    private Long branchId;

    public AssignBranchRequestDto() {}

    public AssignBranchRequestDto(Long branchId) {
        this.branchId = branchId;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }
}
