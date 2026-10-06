package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AuthResponseDto;
import com.example.BigBite.auth.dto.LoginRequestDto;
import com.example.BigBite.auth.dto.RegisterRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import com.example.BigBite.auth.exception.AccountStatusException;
import com.example.BigBite.auth.exception.EmailAlreadyExistsException;
import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.auth.security.JwtUtil;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.branch.BranchStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final BranchRepository branchRepository;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil,
                       BranchRepository branchRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.branchRepository = branchRepository;
    }

    @Transactional
    public AuthResponseDto registerCustomer(RegisterRequestDto request) {
        User savedUser = userRepository.save(newUser(request, Role.CUSTOMER, UserStatus.ACTIVE, null));
        return AuthResponseDto.success(jwtUtil.generateToken(savedUser), savedUser);
    }

    /** Managers apply without a branch; the Super Admin approves them and assigns one. */
    @Transactional
    public AuthResponseDto registerBranchManager(RegisterRequestDto request) {
        userRepository.save(newUser(request, Role.BRANCH_MANAGER, UserStatus.PENDING_APPROVAL, null));
        return AuthResponseDto.pending("Registration successful. Your account is awaiting Super Admin approval.");
    }

    /** Staff apply to one branch; that branch's manager approves them. */
    @Transactional
    public AuthResponseDto registerStaff(RegisterRequestDto request) {
        return registerBranchWorker(request, Role.STAFF);
    }

    /** Riders apply to one branch; that branch's manager approves them. */
    @Transactional
    public AuthResponseDto registerDeliveryPartner(RegisterRequestDto request) {
        return registerBranchWorker(request, Role.DELIVERY_PARTNER);
    }

    private AuthResponseDto registerBranchWorker(RegisterRequestDto request, Role role) {
        Long branchId = request.getBranchId();
        if (branchId == null) {
            throw new IllegalArgumentException("Choose the branch you want to work at");
        }
        boolean activeBranch = branchRepository.findById(branchId)
                .map(branch -> branch.getStatus() == BranchStatus.ACTIVE)
                .orElse(false);
        if (!activeBranch) {
            throw new IllegalArgumentException("The selected branch is not accepting applications");
        }
        userRepository.save(newUser(request, role, UserStatus.PENDING_APPROVAL, branchId));
        return AuthResponseDto.pending("Registration successful. Your account is awaiting approval from the branch manager.");
    }

    private User newUser(RegisterRequestDto request, Role role, UserStatus status, Long branchId) {
        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email) || userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email is already registered: " + email);
        }
        User user = new User(
                request.getName().trim(),
                email,
                request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null,
                passwordEncoder.encode(request.getPassword()),
                role,
                status
        );
        user.setBranchId(branchId);
        return user;
    }

    public AuthResponseDto login(LoginRequestDto request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim();
        User user = userRepository.findByEmail(email)
                .or(() -> userRepository.findByEmail(email.toLowerCase(Locale.ROOT)))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.getStatus() == UserStatus.PENDING_APPROVAL) {
            String approver = user.getRole() == Role.BRANCH_MANAGER ? "admin" : "branch manager";
            throw new AccountStatusException("Your account is awaiting " + approver + " approval");
        }

        if (user.getStatus() == UserStatus.REJECTED) {
            String reason = user.getRejectionReason() != null ? ": " + user.getRejectionReason() : "";
            throw new AccountStatusException("Your account has been rejected" + reason);
        }

        if (user.getStatus() == UserStatus.SUSPENDED) {
            throw new AccountStatusException("Your account has been suspended. Please contact support.");
        }

        // ACTIVE or APPROVED accounts are allowed to log in
        return AuthResponseDto.success(jwtUtil.generateToken(user), user);
    }

    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return UserDto.fromEntity(user);
    }
}
