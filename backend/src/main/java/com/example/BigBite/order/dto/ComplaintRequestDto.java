package com.example.BigBite.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ComplaintRequestDto(
        @NotBlank(message = "Choose a complaint category") String category,
        @NotBlank(message = "Describe the problem") @Size(min = 10, max = 1000,
                message = "Description must be 10 to 1000 characters") String description) {
}
