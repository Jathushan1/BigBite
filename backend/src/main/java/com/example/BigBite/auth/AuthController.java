package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AuthResponseDto;
import com.example.BigBite.auth.dto.ChangePasswordRequestDto;
import com.example.BigBite.auth.dto.ForgotPasswordRequestDto;
import com.example.BigBite.auth.dto.LoginRequestDto;
import com.example.BigBite.auth.dto.MessageResponseDto;
import com.example.BigBite.auth.dto.RegisterRequestDto;
import com.example.BigBite.auth.dto.ResetPasswordRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import com.example.BigBite.auth.password.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    public AuthController(AuthService authService, PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/register/customer")
    public ResponseEntity<AuthResponseDto> registerCustomer(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerCustomer(request));
    }

    @PostMapping("/register/branch-manager")
    public ResponseEntity<AuthResponseDto> registerBranchManager(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerBranchManager(request));
    }

    @PostMapping("/register/staff")
    public ResponseEntity<AuthResponseDto> registerStaff(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerStaff(request));
    }

    @PostMapping("/register/delivery-partner")
    public ResponseEntity<AuthResponseDto> registerDeliveryPartner(@Valid @RequestBody RegisterRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerDeliveryPartner(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponseDto> forgotPassword(@Valid @RequestBody ForgotPasswordRequestDto request,
                                                             HttpServletRequest servletRequest) {
        String message = passwordResetService.requestReset(request.email(), servletRequest.getRemoteAddr());
        return ResponseEntity.ok(new MessageResponseDto(message));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponseDto> resetPassword(@Valid @RequestBody ResetPasswordRequestDto request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(new MessageResponseDto("Your password has been reset. You can now sign in."));
    }

    @PutMapping("/change-password")
    public ResponseEntity<MessageResponseDto> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                             @Valid @RequestBody ChangePasswordRequestDto request) {
        passwordResetService.changePassword(userDetails.getUsername(), request.currentPassword(), request.newPassword());
        return ResponseEntity.ok(new MessageResponseDto("Password changed. Please sign in again on your other devices."));
    }
}
