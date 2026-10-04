package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AssignBranchRequestDto;
import com.example.BigBite.auth.dto.RejectUserRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    private User pendingManager;
    private User superAdmin;

    @BeforeEach
    void setUp() {
        superAdmin = new User("Super Admin", "admin@bigbite.com", "pass", Role.SUPER_ADMIN, UserStatus.ACTIVE);
        superAdmin.setId(99L);

        pendingManager = new User("Bob Manager", "bob@example.com", "pass", Role.BRANCH_MANAGER, UserStatus.PENDING_APPROVAL);
        pendingManager.setId(5L);
    }

    @Test
    @DisplayName("Admin can fetch pending users")
    void testGetPendingUsers() {
        when(userRepository.findByStatus(UserStatus.PENDING_APPROVAL)).thenReturn(List.of(pendingManager));

        List<UserDto> pending = adminUserService.getPendingUsers();

        assertEquals(1, pending.size());
        assertEquals("bob@example.com", pending.get(0).getEmail());
        assertEquals(UserStatus.PENDING_APPROVAL, pending.get(0).getStatus());
    }

    @Test
    @DisplayName("Admin can approve a pending user")
    void testApproveUser() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(pendingManager));
        when(userRepository.findByEmail("admin@bigbite.com")).thenReturn(Optional.of(superAdmin));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto approved = adminUserService.approveUser(5L, "admin@bigbite.com");

        assertEquals(UserStatus.APPROVED, approved.getStatus());
        assertEquals(99L, approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());
        assertNull(approved.getRejectionReason());
    }

    @Test
    @DisplayName("Admin can reject a pending user with reason")
    void testRejectUser() {
        when(userRepository.findById(5L)).thenReturn(Optional.of(pendingManager));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto rejected = adminUserService.rejectUser(5L, new RejectUserRequestDto("Invalid background check"));

        assertEquals(UserStatus.REJECTED, rejected.getStatus());
        assertEquals("Invalid background check", rejected.getRejectionReason());
    }

    @Test
    @DisplayName("Admin can assign a branch to branch manager")
    void testAssignBranchToManager() {
        pendingManager.setStatus(UserStatus.APPROVED);
        when(userRepository.findById(5L)).thenReturn(Optional.of(pendingManager));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDto updated = adminUserService.assignBranch(5L, new AssignBranchRequestDto(42L));

        assertEquals(42L, updated.getBranchId());
    }

    @Test
    @DisplayName("Assign branch to CUSTOMER fails with IllegalArgumentException")
    void testAssignBranchToCustomerFails() {
        User customer = new User("Alice", "alice@example.com", "pass", Role.CUSTOMER, UserStatus.ACTIVE);
        customer.setId(7L);
        when(userRepository.findById(7L)).thenReturn(Optional.of(customer));

        assertThrows(IllegalArgumentException.class, () -> adminUserService.assignBranch(7L, new AssignBranchRequestDto(42L)));
    }
}
