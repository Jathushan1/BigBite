package com.example.BigBite.support;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.menu.repository.MenuItemRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/** Creates real branch, menu and user rows for HTTP-level tests. */
@Component
public class TestFixtures {

    public static final String APPROVED_CARD =
            "{\"holderName\":\"Test Customer\",\"number\":\"4242 4242 4242 4242\",\"expMonth\":12,\"expYear\":2035,\"cvc\":\"123\"}";
    public static final String DECLINED_CARD =
            "{\"holderName\":\"Test Customer\",\"number\":\"4000000000000002\",\"expMonth\":12,\"expYear\":2035,\"cvc\":\"123\"}";

    private final BranchRepository branches;
    private final MenuItemRepository menu;
    private final UserRepository users;

    public TestFixtures(BranchRepository branches, MenuItemRepository menu, UserRepository users) {
        this.branches = branches;
        this.menu = menu;
        this.users = users;
    }

    public static String cardPayment(String method, String cardJson) {
        return "{\"method\":\"" + method + "\",\"card\":" + cardJson + "}";
    }

    /** An always-open branch that supports takeaway and cash on delivery. */
    public Branch branch() {
        String code = "T" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Branch branch = new Branch("Test Branch " + code, code, "1 Test Road", "Colombo", "0112345678", code.toLowerCase() + "@test.lk");
        return branches.save(branch);
    }

    public MenuItem menuItem(Branch branch, String price) {
        MenuItem item = new MenuItem();
        item.setMenuName("Test Pizza " + UUID.randomUUID().toString().substring(0, 4));
        item.setCategory("Pizza");
        item.setPrice(new BigDecimal(price));
        item.setAvailability(true);
        item.setBranch(branch);
        return menu.save(item);
    }

    public User user(Role role, Long branchId) {
        UserStatus status = role == Role.CUSTOMER || role == Role.SUPER_ADMIN ? UserStatus.ACTIVE : UserStatus.APPROVED;
        User user = new User(role.name(), role.name().toLowerCase() + "-" + UUID.randomUUID() + "@example.com",
                "secret", role, status);
        user.setBranchId(branchId);
        return users.save(user);
    }

    public User customer() {
        return user(Role.CUSTOMER, null);
    }
}
