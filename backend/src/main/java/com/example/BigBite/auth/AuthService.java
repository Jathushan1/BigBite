package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AuthResponseDto;
import com.example.BigBite.auth.dto.LoginRequestDto;
import com.example.BigBite.auth.dto.RegisterRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import com.example.BigBite.auth.exception.AccountStatusException;
import com.example.BigBite.auth.exception.EmailAlreadyExistsException;
import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.auth.security.JwtUtil;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponseDto registerCustomer(RegisterRequestDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email is already registered: " + request.getEmail());
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser);

        return AuthResponseDto.success(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole(),
                savedUser.getStatus(),
                savedUser.getBranchId()
        );
    }

    @Transactional
    public AuthResponseDto registerBranchManager(RegisterRequestDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email is already registered: " + request.getEmail());
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.BRANCH_MANAGER,
                UserStatus.PENDING_APPROVAL
        );

        userRepository.save(user);

        return AuthResponseDto.pending("Registration successful. Your account is awaiting admin approval.");
    }

    @Transactional
    public AuthResponseDto registerDeliveryPartner(RegisterRequestDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email is already registered: " + request.getEmail());
        }

        User user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.DELIVERY_PARTNER,
                UserStatus.PENDING_APPROVAL
        );

        userRepository.save(user);

        return AuthResponseDto.pending("Registration successful. Your account is awaiting admin approval.");
    }

    public AuthResponseDto login(LoginRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        // Account status flow check
        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            throw new AccountStatusException("Your account is awaiting admin approval");
        }

        if (user.getStatus() == UserStatus.REJECTED) {
            String reason = user.getRejectionReason() != null ? ": " + user.getRejectionReason() : "";
            throw new AccountStatusException("Your account has been rejected" + reason);
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new AccountStatusException("Your account has been suspended. Please contact support.");
        }

        // ACTIVE or APPROVED accounts are allowed to log in
        String token = jwtUtil.generateToken(user);

        return AuthResponseDto.success(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getBranchId()
        );
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserDto.fromEntity(user);
    }
}
