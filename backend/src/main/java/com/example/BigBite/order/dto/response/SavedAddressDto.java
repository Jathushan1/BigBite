package com.example.BigBite.order.dto.response;

import com.example.BigBite.order.entity.SavedAddress;

import java.time.LocalDateTime;

public record SavedAddressDto(Long id, Long customerId, String addressLine, String city, LocalDateTime createdAt) {
    public static SavedAddressDto fromEntity(SavedAddress address) {
        return new SavedAddressDto(address.getId(), address.getCustomerId(), address.getAddressLine(),
                address.getCity(), address.getCreatedAt());
    }
}
