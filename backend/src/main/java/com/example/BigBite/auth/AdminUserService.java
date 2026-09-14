package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AssignBranchRequestDto;
import com.example.BigBite.auth.dto.RejectUserRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import com.example.BigBite.auth.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;

    public AdminUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public List<UserDto> getPendingUsers() {
        return userRepository.findByStatus(UserStatus.PENDING_APPROVAL)
                .stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto approveUser(Long userId, String superAdminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Long approverId = null;
        if (superAdminEmail != null) {
            approverId = userRepository.findByEmail(superAdminEmail)
                    .map(User::getId)
                    .orElse(null);
        }

        user.setStatus(UserStatus.APPROVED);
        user.setApprovedAt(LocalDateTime.now());
        user.setApprovedBy(approverId);
        user.setRejectionReason(null);

        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto rejectUser(Long userId, RejectUserRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(request != null ? request.getReason() : null);

        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto assignBranch(Long userId, AssignBranchRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() != Role.BRANCH_MANAGER && user.getRole() != Role.DELIVERY_PARTNER) {
            throw new IllegalArgumentException("Only BRANCH_MANAGER and DELIVERY_PARTNER can be assigned to a branch");
        }

        user.setBranchId(request.getBranchId());

        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    public List<UserDto> getUsers(Role role, UserStatus status) {
        return userRepository.findByFilter(role, status)
                .stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Cannot delete SUPER_ADMIN account");
        }

        userRepository.delete(user);
    }
}
