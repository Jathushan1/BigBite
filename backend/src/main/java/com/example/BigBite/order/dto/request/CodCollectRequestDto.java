package com.example.BigBite.order.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CodCollectRequestDto(@NotNull @DecimalMin("0.00") BigDecimal cashCollected) {}
