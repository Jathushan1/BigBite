package inventory.security;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class InventoryAccessGuard {

    private final UserRepository userRepository;

    public InventoryAccessGuard(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void requireManageAccess(Long branchId) {
        User user = getCurrentUser();

        if (user.getRole() == Role.SUPER_ADMIN) {
            return;
        }

        if (user.getRole() == Role.BRANCH_MANAGER
                && user.getBranchId() != null
                && user.getBranchId().equals(branchId)) {
            return;
        }

        throw new AccessDeniedException("You can only manage inventory of your assigned branch (Assigned branch: #" + user.getBranchId() + ")");
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication is required");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("User not found"));
    }
}
