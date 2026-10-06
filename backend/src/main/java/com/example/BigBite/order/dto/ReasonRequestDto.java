package com.example.BigBite.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A required free-text reason, used for rejecting orders and requesting a cancellation. */
public record ReasonRequestDto(
        @NotBlank(message = "Please give a reason") @Size(max = 255, message = "Reason is too long") String reason) {
}
