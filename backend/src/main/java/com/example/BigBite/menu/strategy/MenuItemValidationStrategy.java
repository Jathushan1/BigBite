package com.example.BigBite.menu.strategy;

import com.example.BigBite.menu.dto.MenuItemRequestDto;

public interface MenuItemValidationStrategy {

    void validate(MenuItemRequestDto request);
}
