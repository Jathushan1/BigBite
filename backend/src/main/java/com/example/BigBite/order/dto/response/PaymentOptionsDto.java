package com.example.BigBite.order.dto.response;

import com.example.BigBite.order.enums.PaymentMethod;

import java.util.List;

public record PaymentOptionsDto(List<PaymentMethod> methods, boolean codEligible,
                                String codReason, String codMessage) {}
