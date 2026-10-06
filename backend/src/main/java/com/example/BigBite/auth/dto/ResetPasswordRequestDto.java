package com.example.BigBite.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPasswordRequestDto(
        @NotBlank(message = "Reset token is required") String token,
        @NotBlank(message = "New password is required")
        @Pattern(regexp = PasswordPolicy.REGEX, message = PasswordPolicy.MESSAGE) String newPassword) {
}
