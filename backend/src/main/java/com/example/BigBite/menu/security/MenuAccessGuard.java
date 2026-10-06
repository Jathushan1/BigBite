package com.example.BigBite.menu.security;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class MenuAccessGuard {

    private final UserRepository userRepository;

    public MenuAccessGuard(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void requireManageAccess(Long branchId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        if (user.getRole() == Role.SUPER_ADMIN && user.getStatus() == UserStatus.ACTIVE) {
            return;
        }
        if (user.getRole() == Role.BRANCH_MANAGER
                && user.getStatus() == UserStatus.APPROVED
                && user.getBranchId() != null
                && user.getBranchId().equals(branchId)) {
            return;
        }
        throw new AccessDeniedException("You can only manage menu items of your assigned branch");
    }
}
