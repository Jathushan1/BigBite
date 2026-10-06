package com.example.BigBite.menu.dto;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MenuItemRequestDtoValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    @Test
    void validRequestHasNoViolations() {
        assertTrue(validator.validate(request("Burger", new BigDecimal("1200.50"))).isEmpty());
    }

    @Test
    void blankNameIsRejected() {
        assertFalse(validator.validate(request("", new BigDecimal("1200.50"))).isEmpty());
    }

    @Test
    void missingPriceIsRejected() {
        assertFalse(validator.validate(request("Burger", null)).isEmpty());
    }

    @Test
    void priceWithThreeDecimalsIsRejected() {
        assertFalse(validator.validate(request("Burger", new BigDecimal("12.345"))).isEmpty());
    }

    private MenuItemRequestDto request(String name, BigDecimal price) {
        MenuItemRequestDto request = new MenuItemRequestDto();
        request.setMenuName(name);
        request.setPrice(price);
        return request;
    }
}
