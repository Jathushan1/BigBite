package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AuthResponseDto;
import com.example.BigBite.auth.dto.LoginRequestDto;
import com.example.BigBite.auth.dto.RegisterRequestDto;
import com.example.BigBite.auth.exception.AccountStatusException;
import com.example.BigBite.auth.exception.EmailAlreadyExistsException;
import com.example.BigBite.auth.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthService authService;

    private RegisterRequestDto customerRegisterDto;
    private RegisterRequestDto staffRegisterDto;

    @BeforeEach
    void setUp() {
        customerRegisterDto = new RegisterRequestDto("Alice Customer", "alice@example.com", "secret123");
        staffRegisterDto = new RegisterRequestDto("Bob Manager", "bob@example.com", "secret123");
    }

    @Test
    @DisplayName("Customer registration sets ACTIVE status and returns immediate JWT token")
    void testRegisterCustomer() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");

        User savedUser = new User("Alice Customer", "alice@example.com", "encodedPassword", Role.CUSTOMER, UserStatus.ACTIVE);
        savedUser.setId(1L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtUtil.generateToken(savedUser)).thenReturn("jwt.token.alice");

        AuthResponseDto response = authService.registerCustomer(customerRegisterDto);

        assertNotNull(response);
        assertEquals("jwt.token.alice", response.getToken());
        assertEquals(Role.CUSTOMER, response.getRole());
        assertEquals(UserStatus.ACTIVE, response.getStatus());
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Branch Manager registration sets PENDING_APPROVAL status and returns no token")
    void testRegisterBranchManager() {
        when(userRepository.existsByEmail("bob@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");

        AuthResponseDto response = authService.registerBranchManager(staffRegisterDto);

        assertNotNull(response);
        assertNull(response.getToken());
        assertEquals(UserStatus.PENDING_APPROVAL, response.getStatus());
        assertTrue(response.getMessage().contains("awaiting admin approval"));
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Delivery Partner registration sets PENDING_APPROVAL status and returns no token")
    void testRegisterDeliveryPartner() {
        RegisterRequestDto riderDto = new RegisterRequestDto("Rider Dan", "dan@example.com", "secret123");
        when(userRepository.existsByEmail("dan@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("encodedPassword");

        AuthResponseDto response = authService.registerDeliveryPartner(riderDto);

        assertNotNull(response);
        assertNull(response.getToken());
        assertEquals(UserStatus.PENDING_APPROVAL, response.getStatus());
        assertTrue(response.getMessage().contains("awaiting admin approval"));
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Registration throws EmailAlreadyExistsException if email already taken")
    void testRegisterDuplicateEmail() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> authService.registerCustomer(customerRegisterDto));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Login blocked with 403 AccountStatusException if account is PENDING_APPROVAL")
    void testLoginPendingApprovalBlocked() {
        User pendingUser = new User("Bob Manager", "bob@example.com", "encodedPassword", Role.BRANCH_MANAGER, UserStatus.PENDING_APPROVAL);
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(pendingUser));
        when(passwordEncoder.matches("secret123", "encodedPassword")).thenReturn(true);

        LoginRequestDto loginDto = new LoginRequestDto("bob@example.com", "secret123");

        AccountStatusException ex = assertThrows(AccountStatusException.class, () -> authService.login(loginDto));
        assertEquals("Your account is awaiting admin approval", ex.getMessage());
        verify(jwtUtil, never()).generateToken(any());
    }

    @Test
    @DisplayName("Login blocked with 403 AccountStatusException if account is REJECTED")
    void testLoginRejectedBlocked() {
        User rejectedUser = new User("Bob Manager", "bob@example.com", "encodedPassword", Role.BRANCH_MANAGER, UserStatus.REJECTED);
        rejectedUser.setRejectionReason("Documents incomplete");
        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(rejectedUser));
        when(passwordEncoder.matches("secret123", "encodedPassword")).thenReturn(true);

        LoginRequestDto loginDto = new LoginRequestDto("bob@example.com", "secret123");

        AccountStatusException ex = assertThrows(AccountStatusException.class, () -> authService.login(loginDto));
        assertTrue(ex.getMessage().contains("rejected"));
        assertTrue(ex.getMessage().contains("Documents incomplete"));
    }

    @Test
    @DisplayName("Login succeeds for APPROVED Branch Manager")
    void testLoginApprovedSuccess() {
        User approvedUser = new User("Bob Manager", "bob@example.com", "encodedPassword", Role.BRANCH_MANAGER, UserStatus.APPROVED);
        approvedUser.setId(2L);
        approvedUser.setBranchId(10L);

        when(userRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(approvedUser));
        when(passwordEncoder.matches("secret123", "encodedPassword")).thenReturn(true);
        when(jwtUtil.generateToken(approvedUser)).thenReturn("jwt.token.bob");

        LoginRequestDto loginDto = new LoginRequestDto("bob@example.com", "secret123");
        AuthResponseDto response = authService.login(loginDto);

        assertNotNull(response);
        assertEquals("jwt.token.bob", response.getToken());
        assertEquals(Role.BRANCH_MANAGER, response.getRole());
        assertEquals(UserStatus.APPROVED, response.getStatus());
        assertEquals(10L, response.getBranchId());
    }

    @Test
    @DisplayName("Login fails with BadCredentialsException for invalid password")
    void testLoginInvalidPassword() {
        User user = new User("Alice Customer", "alice@example.com", "encodedPassword", Role.CUSTOMER, UserStatus.ACTIVE);
        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        LoginRequestDto loginDto = new LoginRequestDto("alice@example.com", "wrongPassword");

        assertThrows(BadCredentialsException.class, () -> authService.login(loginDto));
    }
}
