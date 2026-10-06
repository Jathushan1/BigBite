package com.example.BigBite.order.dto;

import com.example.BigBite.order.PaymentMethod;

import java.util.List;

public record PaymentOptionsDto(List<PaymentMethod> methods, boolean codEligible,
                                String codReason, String codMessage) {}
