package com.example.BigBite.menu.strategy;

import com.example.BigBite.menu.entity.MenuItem;

/** Strategy interface: validation rules can be swapped without changing the service. */
public interface MenuItemValidationStrategy {
    void validate(MenuItem menuItem);
}
