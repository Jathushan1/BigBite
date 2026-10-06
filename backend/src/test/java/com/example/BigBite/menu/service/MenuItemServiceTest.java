package com.example.BigBite.menu.service;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.menu.dto.MenuItemRequestDto;
import com.example.BigBite.menu.dto.MenuItemResponseDto;
import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.menu.event.MenuItemChangedEvent;
import com.example.BigBite.menu.factory.MenuItemFactory;
import com.example.BigBite.menu.repository.MenuItemRepository;
import com.example.BigBite.menu.security.MenuAccessGuard;
import com.example.BigBite.menu.strategy.DefaultMenuItemValidationStrategy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MenuItemServiceTest {

    private static final Long OWN_BRANCH_ID = 1L;
    private static final Long OTHER_BRANCH_ID = 2L;
    private static final Long MENU_ID = 10L;
    private static final String EMAIL = "user@bigbite.com";

    @Mock
    private MenuItemRepository menuItemRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private MenuItemService menuItemService;

    @BeforeEach
    void setUp() {
        menuItemService = new MenuItemService(
                menuItemRepository,
                branchRepository,
                new DefaultMenuItemValidationStrategy(),
                new MenuItemFactory(),
                new MenuAccessGuard(userRepository),
                eventPublisher
        );
        SecurityContextHolder.getContext().setAuthentication(
                new TestingAuthenticationToken(EMAIL, "password", "ROLE_USER"));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void superAdminCanCreateMenuItemInAnyBranch() {
        loginAs(Role.SUPER_ADMIN, null);
        when(branchRepository.findById(OTHER_BRANCH_ID)).thenReturn(Optional.of(branch(OTHER_BRANCH_ID)));
        stubSave();

        MenuItemResponseDto created = menuItemService.createMenuItem(OTHER_BRANCH_ID, request("Burger", "1200.50"));

        assertEquals(MENU_ID, created.getMenuId());
        assertEquals(OTHER_BRANCH_ID, created.getBranchId());
        assertEquals(new BigDecimal("1200.50"), created.getPrice());
    }

    @Test
    void branchManagerCanCreateMenuItemInOwnBranch() {
        loginAs(Role.BRANCH_MANAGER, OWN_BRANCH_ID);
        when(branchRepository.findById(OWN_BRANCH_ID)).thenReturn(Optional.of(branch(OWN_BRANCH_ID)));
        stubSave();

        MenuItemResponseDto created = menuItemService.createMenuItem(OWN_BRANCH_ID, request("Burger", "1200"));

        assertEquals(OWN_BRANCH_ID, created.getBranchId());
        assertEquals(new BigDecimal("1200.00"), created.getPrice());
    }

    @Test
    void branchManagerCannotCreateMenuItemInOtherBranch() {
        loginAs(Role.BRANCH_MANAGER, OWN_BRANCH_ID);

        assertThrows(AccessDeniedException.class,
                () -> menuItemService.createMenuItem(OTHER_BRANCH_ID, request("Burger", "1200")));

        verify(menuItemRepository, never()).save(any(MenuItem.class));
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void branchManagerWithoutAssignedBranchCannotCreateMenuItem() {
        loginAs(Role.BRANCH_MANAGER, null);

        assertThrows(AccessDeniedException.class,
                () -> menuItemService.createMenuItem(OWN_BRANCH_ID, request("Burger", "1200")));

        verify(menuItemRepository, never()).save(any(MenuItem.class));
    }

    @Test
    void customerCannotCreateMenuItem() {
        loginAs(Role.CUSTOMER, null);

        assertThrows(AccessDeniedException.class,
                () -> menuItemService.createMenuItem(OWN_BRANCH_ID, request("Burger", "1200")));

        verify(menuItemRepository, never()).save(any(MenuItem.class));
    }

    @Test
    void branchManagerCannotUpdateMenuItemOfOtherBranch() {
        loginAs(Role.BRANCH_MANAGER, OWN_BRANCH_ID);
        when(menuItemRepository.findById(MENU_ID)).thenReturn(Optional.of(menuItem(OTHER_BRANCH_ID)));

        assertThrows(AccessDeniedException.class,
                () -> menuItemService.updateMenuItem(MENU_ID, request("Pizza", "2500")));

        verify(menuItemRepository, never()).save(any(MenuItem.class));
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void branchManagerCannotDeleteMenuItemOfOtherBranch() {
        loginAs(Role.BRANCH_MANAGER, OWN_BRANCH_ID);
        when(menuItemRepository.findById(MENU_ID)).thenReturn(Optional.of(menuItem(OTHER_BRANCH_ID)));

        assertThrows(AccessDeniedException.class, () -> menuItemService.deleteMenuItem(MENU_ID));

        verify(menuItemRepository, never()).delete(any(MenuItem.class));
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void branchManagerCanUpdateMenuItemOfOwnBranch() {
        loginAs(Role.BRANCH_MANAGER, OWN_BRANCH_ID);
        when(menuItemRepository.findById(MENU_ID)).thenReturn(Optional.of(menuItem(OWN_BRANCH_ID)));
        stubSave();

        MenuItemResponseDto updated = menuItemService.updateMenuItem(MENU_ID, request("Pizza", "2500"));

        assertEquals("Pizza", updated.getMenuName());
        assertEquals(new BigDecimal("2500.00"), updated.getPrice());
    }

    @Test
    void createFailsWhenBranchDoesNotExist() {
        loginAs(Role.SUPER_ADMIN, null);
        when(branchRepository.findById(OWN_BRANCH_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> menuItemService.createMenuItem(OWN_BRANCH_ID, request("Burger", "1200")));

        verify(menuItemRepository, never()).save(any(MenuItem.class));
    }

    @Test
    void createRejectsNonPositivePrice() {
        loginAs(Role.SUPER_ADMIN, null);

        assertThrows(IllegalArgumentException.class,
                () -> menuItemService.createMenuItem(OWN_BRANCH_ID, request("Burger", "0")));

        verify(menuItemRepository, never()).save(any(MenuItem.class));
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void updateFailsWhenMenuItemDoesNotExist() {
        when(menuItemRepository.findById(MENU_ID)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> menuItemService.updateMenuItem(MENU_ID, request("Pizza", "2500")));
    }

    @Test
    void createPublishesCreatedEvent() {
        loginAs(Role.SUPER_ADMIN, null);
        when(branchRepository.findById(OWN_BRANCH_ID)).thenReturn(Optional.of(branch(OWN_BRANCH_ID)));
        stubSave();

        menuItemService.createMenuItem(OWN_BRANCH_ID, request("Burger", "1200"));

        MenuItemChangedEvent event = capturedEvent();
        assertEquals("created", event.getAction());
        assertEquals(MENU_ID, event.getMenuId());
        assertEquals("Burger", event.getMenuName());
    }

    @Test
    void updatePublishesUpdatedEvent() {
        loginAs(Role.SUPER_ADMIN, null);
        when(menuItemRepository.findById(MENU_ID)).thenReturn(Optional.of(menuItem(OWN_BRANCH_ID)));
        stubSave();

        menuItemService.updateMenuItem(MENU_ID, request("Pizza", "2500"));

        MenuItemChangedEvent event = capturedEvent();
        assertEquals("updated", event.getAction());
        assertEquals("Pizza", event.getMenuName());
    }

    @Test
    void deletePublishesDeletedEvent() {
        loginAs(Role.SUPER_ADMIN, null);
        MenuItem existing = menuItem(OWN_BRANCH_ID);
        when(menuItemRepository.findById(MENU_ID)).thenReturn(Optional.of(existing));

        menuItemService.deleteMenuItem(MENU_ID);

        verify(menuItemRepository).delete(existing);
        MenuItemChangedEvent event = capturedEvent();
        assertEquals("deleted", event.getAction());
        assertEquals(MENU_ID, event.getMenuId());
    }

    private void loginAs(Role role, Long branchId) {
        User user = new User("Test User", EMAIL, "password", role,
                role == Role.SUPER_ADMIN ? UserStatus.ACTIVE : UserStatus.APPROVED);
        user.setBranchId(branchId);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
    }

    private void stubSave() {
        when(menuItemRepository.save(any(MenuItem.class))).thenAnswer(invocation -> {
            MenuItem menuItem = invocation.getArgument(0);
            menuItem.setMenuId(MENU_ID);
            return menuItem;
        });
    }

    private MenuItemChangedEvent capturedEvent() {
        ArgumentCaptor<MenuItemChangedEvent> captor = ArgumentCaptor.forClass(MenuItemChangedEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        return captor.getValue();
    }

    private Branch branch(Long id) {
        Branch branch = new Branch("Branch " + id, "BR" + id, "Address", "Colombo", "0112345678", "branch@bigbite.com");
        branch.setId(id);
        return branch;
    }

    private MenuItem menuItem(Long branchId) {
        MenuItem menuItem = new MenuItem();
        menuItem.setMenuId(MENU_ID);
        menuItem.setMenuName("Burger");
        menuItem.setPrice(new BigDecimal("1200.00"));
        menuItem.setAvailability(true);
        menuItem.setBranch(branch(branchId));
        return menuItem;
    }

    private MenuItemRequestDto request(String name, String price) {
        MenuItemRequestDto request = new MenuItemRequestDto();
        request.setMenuName(name);
        request.setCategory("Mains");
        request.setPrice(new BigDecimal(price));
        return request;
    }
}
