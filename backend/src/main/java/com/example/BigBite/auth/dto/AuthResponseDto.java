package com.example.BigBite.auth.dto;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.UserStatus;

public class AuthResponseDto {

    private String token;
    private String type = "Bearer";
    private Long id;
    private String name;
    private String email;
    private Role role;
    private UserStatus status;
    private Long branchId;
    private String message;

    public AuthResponseDto() {}

    public AuthResponseDto(String token, Long id, String name, String email, Role role, UserStatus status, Long branchId, String message) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.status = status;
        this.branchId = branchId;
        this.message = message;
    }

    public static AuthResponseDto success(String token, Long id, String name, String email, Role role, UserStatus status, Long branchId) {
        return new AuthResponseDto(token, id, name, email, role, status, branchId, "Authentication successful");
    }

    public static AuthResponseDto pending(String message) {
        AuthResponseDto dto = new AuthResponseDto();
        dto.setMessage(message);
        dto.setStatus(UserStatus.PENDING_APPROVAL);
        return dto;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
