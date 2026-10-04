package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AuthResponseDto;
import com.example.BigBite.auth.dto.LoginRequestDto;
import com.example.BigBite.auth.dto.RegisterRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register/customer")
    public ResponseEntity<AuthResponseDto> registerCustomer(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto response = authService.registerCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/branch-manager")
    public ResponseEntity<AuthResponseDto> registerBranchManager(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto response = authService.registerBranchManager(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/register/delivery-partner")
    public ResponseEntity<AuthResponseDto> registerDeliveryPartner(@Valid @RequestBody RegisterRequestDto request) {
        AuthResponseDto response = authService.registerDeliveryPartner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        AuthResponseDto response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        UserDto user = authService.getCurrentUser(userDetails.getUsername());
        return ResponseEntity.ok(user);
    }
}
