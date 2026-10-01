package com.example.BigBite.order.dto;

import jakarta.validation.constraints.NotBlank;

public record DeliveryFailedRequestDto(@NotBlank String reason) {}
