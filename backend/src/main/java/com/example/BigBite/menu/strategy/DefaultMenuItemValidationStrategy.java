package com.example.BigBite.menu.strategy;

import com.example.BigBite.menu.dto.MenuItemRequestDto;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class DefaultMenuItemValidationStrategy implements MenuItemValidationStrategy {

    @Override
    public void validate(MenuItemRequestDto request) {
        if (request == null) {
            throw new IllegalArgumentException("Menu item data is required");
        }
        if (request.getMenuName() == null || request.getMenuName().isBlank()) {
            throw new IllegalArgumentException("Menu name is required");
        }
        if (request.getPrice() == null) {
            throw new IllegalArgumentException("Price is required");
        }
        if (request.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }
        if (request.getPrice().stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("Price can have at most 2 decimal places");
        }
    }
}
