package com.example.BigBite.menu.controller;

import com.example.BigBite.menu.dto.MenuItemRequestDto;
import com.example.BigBite.menu.service.MenuItemService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class MenuItemControllerSecurityTest {

    private AnnotationConfigApplicationContext context;
    private MenuItemController controller;
    private MenuItemService menuItemService;

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    static class TestConfig {

        @Bean
        MenuItemService menuItemService() {
            return Mockito.mock(MenuItemService.class);
        }

        @Bean
        MenuItemController menuItemController(MenuItemService menuItemService) {
            return new MenuItemController(menuItemService);
        }
    }

    @BeforeEach
    void setUp() {
        context = new AnnotationConfigApplicationContext(TestConfig.class);
        controller = context.getBean(MenuItemController.class);
        menuItemService = context.getBean(MenuItemService.class);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        context.close();
    }

    @Test
    void customerCannotCreateMenuItem() {
        loginWithRole("CUSTOMER");

        assertThrows(AccessDeniedException.class, () -> controller.createMenuItem(1L, request()));

        verify(menuItemService, never()).createMenuItem(any(), any());
    }

    @Test
    void deliveryPartnerCannotUpdateMenuItem() {
        loginWithRole("DELIVERY_PARTNER");

        assertThrows(AccessDeniedException.class, () -> controller.updateMenuItem(1L, request()));

        verify(menuItemService, never()).updateMenuItem(any(), any());
    }

    @Test
    void customerCannotDeleteMenuItem() {
        loginWithRole("CUSTOMER");

        assertThrows(AccessDeniedException.class, () -> controller.deleteMenuItem(1L));

        verify(menuItemService, never()).deleteMenuItem(any());
    }

    @Test
    void branchManagerCanCreateMenuItem() {
        loginWithRole("BRANCH_MANAGER");

        assertEquals(HttpStatus.CREATED, controller.createMenuItem(1L, request()).getStatusCode());

        verify(menuItemService).createMenuItem(any(), any());
    }

    @Test
    void superAdminCanDeleteMenuItem() {
        loginWithRole("SUPER_ADMIN");

        assertEquals(HttpStatus.NO_CONTENT, controller.deleteMenuItem(1L).getStatusCode());

        verify(menuItemService).deleteMenuItem(1L);
    }

    @Test
    void customerCanViewMenuItems() {
        loginWithRole("CUSTOMER");

        assertEquals(HttpStatus.OK, controller.getMenuItemsByBranch(1L).getStatusCode());
    }

    private void loginWithRole(String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken("user@bigbite.com", "password", "ROLE_" + role));
    }

    private MenuItemRequestDto request() {
        MenuItemRequestDto request = new MenuItemRequestDto();
        request.setMenuName("Burger");
        request.setPrice(new BigDecimal("1200.00"));
        return request;
    }
}
