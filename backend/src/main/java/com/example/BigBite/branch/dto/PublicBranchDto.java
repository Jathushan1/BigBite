package com.example.BigBite.branch.dto;

import com.example.BigBite.branch.Branch;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalTime;

/** Branch view that is safe to show to guests: contact details, hours and ordering flags only. */
public record PublicBranchDto(
        Long id,
        String name,
        String branchCode,
        String address,
        String city,
        String phone,
        @JsonFormat(pattern = "HH:mm") LocalTime openingTime,
        @JsonFormat(pattern = "HH:mm") LocalTime closingTime,
        boolean takeawayEnabled,
        boolean codEnabled,
        boolean openNow,
        String status) {

    public static PublicBranchDto fromEntity(Branch branch) {
        return new PublicBranchDto(
                branch.getId(),
                branch.getName(),
                branch.getBranchCode(),
                branch.getAddress(),
                branch.getCity(),
                branch.getPhone(),
                branch.getOpeningTime(),
                branch.getClosingTime(),
                branch.isTakeawayEnabled(),
                branch.isCodEnabled(),
                branch.isOpenAt(LocalTime.now()),
                branch.getStatus().name());
    }
}
