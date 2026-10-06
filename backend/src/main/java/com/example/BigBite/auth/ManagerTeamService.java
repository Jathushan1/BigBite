package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.UserDto;
import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
public class ManagerTeamService {

    private static final Set<Role> TEAM_ROLES = Set.of(Role.STAFF, Role.DELIVERY_PARTNER);

    private final UserRepository userRepository;

    public ManagerTeamService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<UserDto> getTeam(String managerEmail) {
        User manager = requireManager(managerEmail);
        return userRepository.findByBranchIdAndRoleIn(manager.getBranchId(), TEAM_ROLES).stream()
                .sorted(Comparator.comparing((User user) -> user.getStatus() != UserStatus.PENDING_APPROVAL)
                        .thenComparing(User::getName))
                .map(UserDto::fromEntity)
                .toList();
    }

    @Transactional
    public UserDto approve(String managerEmail, Long userId) {
        User manager = requireManager(managerEmail);
        User member = requireTeamMember(manager, userId);
        AdminUserService.approve(member, manager.getId());
        return UserDto.fromEntity(userRepository.save(member));
    }

    @Transactional
    public UserDto reject(String managerEmail, Long userId, String reason) {
        User manager = requireManager(managerEmail);
        User member = requireTeamMember(manager, userId);
        member.setStatus(UserStatus.REJECTED);
        member.setRejectionReason(reason);
        return UserDto.fromEntity(userRepository.save(member));
    }

    @Transactional
    public UserDto suspend(String managerEmail, Long userId) {
        User manager = requireManager(managerEmail);
        User member = requireTeamMember(manager, userId);
        if (member.getStatus() != UserStatus.APPROVED) {
            throw new ApiException(HttpStatus.CONFLICT, "NOT_APPROVED", "Only approved team members can be suspended");
        }
        member.setStatus(UserStatus.SUSPENDED);
        return UserDto.fromEntity(userRepository.save(member));
    }

    @Transactional
    public UserDto reactivate(String managerEmail, Long userId) {
        User manager = requireManager(managerEmail);
        User member = requireTeamMember(manager, userId);
        if (member.getStatus() != UserStatus.SUSPENDED) {
            throw new ApiException(HttpStatus.CONFLICT, "NOT_SUSPENDED", "Only suspended team members can be reactivated");
        }
        member.setStatus(UserStatus.APPROVED);
        return UserDto.fromEntity(userRepository.save(member));
    }

    private User requireManager(String email) {
        User manager = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign in again"));
        if (manager.getRole() != Role.BRANCH_MANAGER || manager.getStatus() != UserStatus.APPROVED) {
            throw new ApiException(HttpStatus.FORBIDDEN, "MANAGER_REQUIRED", "An approved branch manager is required");
        }
        if (manager.getBranchId() == null) {
            throw new ApiException(HttpStatus.CONFLICT, "BRANCH_NOT_ASSIGNED",
                    "The Super Admin has not assigned you to a branch yet");
        }
        return manager;
    }

    private User requireTeamMember(User manager, Long userId) {
        User member = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (!TEAM_ROLES.contains(member.getRole()) || !manager.getBranchId().equals(member.getBranchId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "NOT_YOUR_TEAM",
                    "You can only manage staff and riders of your own branch");
        }
        return member;
    }
}
