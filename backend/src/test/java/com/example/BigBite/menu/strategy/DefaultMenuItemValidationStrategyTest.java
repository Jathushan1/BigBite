package com.example.BigBite.menu.strategy;

import com.example.BigBite.menu.dto.MenuItemRequestDto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DefaultMenuItemValidationStrategyTest {

    private final DefaultMenuItemValidationStrategy strategy = new DefaultMenuItemValidationStrategy();

    @Test
    void acceptsValidRequest() {
        assertDoesNotThrow(() -> strategy.validate(request("Burger", "1200.50")));
    }

    @Test
    void rejectsNullRequest() {
        assertThrows(IllegalArgumentException.class, () -> strategy.validate(null));
    }

    @Test
    void rejectsBlankName() {
        assertThrows(IllegalArgumentException.class, () -> strategy.validate(request("   ", "1200")));
    }

    @Test
    void rejectsMissingPrice() {
        assertThrows(IllegalArgumentException.class, () -> strategy.validate(request("Burger", null)));
    }

    @Test
    void rejectsZeroPrice() {
        assertThrows(IllegalArgumentException.class, () -> strategy.validate(request("Burger", "0.00")));
    }

    @Test
    void rejectsNegativePrice() {
        assertThrows(IllegalArgumentException.class, () -> strategy.validate(request("Burger", "-5")));
    }

    @Test
    void rejectsMoreThanTwoDecimalPlaces() {
        assertThrows(IllegalArgumentException.class, () -> strategy.validate(request("Burger", "10.999")));
    }

    private MenuItemRequestDto request(String name, String price) {
        MenuItemRequestDto request = new MenuItemRequestDto();
        request.setMenuName(name);
        request.setPrice(price != null ? new BigDecimal(price) : null);
        return request;
    }
}
