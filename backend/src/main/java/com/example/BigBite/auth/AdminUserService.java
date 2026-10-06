package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.AssignBranchRequestDto;
import com.example.BigBite.auth.dto.RejectUserRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.branch.BranchStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    public AdminUserService(UserRepository userRepository, BranchRepository branchRepository) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
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
        approve(user, approverId);
        return UserDto.fromEntity(userRepository.save(user));
    }

    /** Shared approval rule: branch-scoped accounts must have an active branch before they can work. */
    static void approve(User user, Long approverId) {
        if (user.getRole() == Role.CUSTOMER || user.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Only staff accounts need approval");
        }
        if (user.getBranchId() == null) {
            throw new IllegalArgumentException("Assign a branch before approving this account");
        }
        user.setStatus(UserStatus.APPROVED);
        user.setApprovedAt(LocalDateTime.now());
        user.setApprovedBy(approverId);
        user.setRejectionReason(null);
    }

    @Transactional
    public UserDto rejectUser(Long userId, RejectUserRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new IllegalArgumentException("Cannot reject the SUPER_ADMIN account");
        }

        user.setStatus(UserStatus.REJECTED);
        user.setRejectionReason(request != null ? request.getReason() : null);

        User saved = userRepository.save(user);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public UserDto assignBranch(Long userId, AssignBranchRequestDto request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!user.getRole().isBranchScopedStaff()) {
            throw new IllegalArgumentException("Only branch managers, staff and delivery partners can be assigned to a branch");
        }
        boolean activeBranch = branchRepository.findById(request.getBranchId())
                .map(branch -> branch.getStatus() == BranchStatus.ACTIVE)
                .orElse(false);
        if (!activeBranch) {
            throw new IllegalArgumentException("Branch " + request.getBranchId() + " does not exist or is inactive");
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
