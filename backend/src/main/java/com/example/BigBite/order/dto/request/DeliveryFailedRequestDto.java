package com.example.BigBite.order.dto.request;

import jakarta.validation.constraints.NotBlank;

public record DeliveryFailedRequestDto(@NotBlank String reason) {}
