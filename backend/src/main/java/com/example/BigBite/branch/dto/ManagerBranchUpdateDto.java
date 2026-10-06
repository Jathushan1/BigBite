package com.example.BigBite.branch.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;

import java.time.LocalTime;

/** The branch fields a branch manager may change; code, name, status and deletion stay with the Super Admin. */
public record ManagerBranchUpdateDto(
        @Pattern(regexp = "^(?:\\+94|0)[1-9][0-9]{8}$", message = "Invalid Sri Lankan phone number") String phone,
        @Email(message = "Invalid email format") String email,
        @JsonFormat(pattern = "HH:mm") LocalTime openingTime,
        @JsonFormat(pattern = "HH:mm") LocalTime closingTime,
        Boolean takeawayEnabled,
        Boolean codEnabled) {
}
