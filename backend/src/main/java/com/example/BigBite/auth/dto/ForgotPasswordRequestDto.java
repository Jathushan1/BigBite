package com.example.BigBite.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequestDto(
        @NotBlank(message = "Email is required") @Email(message = "Invalid email format") String email) {
}
