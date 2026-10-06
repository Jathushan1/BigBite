package com.example.BigBite.integration;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchStatus;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.support.TestFixtures;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Branch, menu, auth and team management working together over HTTP. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class ModuleIntegrationHttpTest {
    @Autowired private MockMvc mvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private UserRepository users;
    @Autowired private BranchRepository branches;

    @Test
    void guestsCanBrowseBranchesAndMenusButNotChangeThem() throws Exception {
        Branch branch = fixtures.branch();
        MenuItem visible = fixtures.menuItem(branch, "1500.00");
        MenuItem hidden = fixtures.menuItem(branch, "900.00");
        hidden.setAvailability(false);
        fixtures.menuItem(branch, "100.00"); // keeps the list non-trivial

        mvc.perform(get("/api/branches")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + branch.getId() + ")].openNow").value(true));
        mvc.perform(get("/api/branches/{id}", branch.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$.takeawayEnabled").value(true))
                .andExpect(jsonPath("$.codEnabled").value(true));
        mvc.perform(get("/api/menu/branch/{id}", branch.getId())).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.menuId == " + visible.getMenuId() + ")]").exists());
        mvc.perform(post("/api/menu/branch/{id}", branch.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuName\":\"Hack\",\"price\":10}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.error").value("AUTH_REQUIRED"));
        mvc.perform(get("/api/admin/branches").with(user("someone@example.com").roles("CUSTOMER")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error").value("FORBIDDEN"));
        mvc.perform(get("/api/menu/not-a-number")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("INVALID_PARAMETER"));
    }

    @Test
    void branchStillInUseCannotBeDeletedButCanBeDeactivated() throws Exception {
        Branch branch = fixtures.branch();
        fixtures.menuItem(branch, "1200.00");
        User admin = fixtures.user(Role.SUPER_ADMIN, null);

        mvc.perform(delete("/api/admin/branches/{id}", branch.getId()).with(user(admin.getEmail()).roles("SUPER_ADMIN")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("BRANCH_IN_USE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("1 menu item")));
        mvc.perform(patch("/api/admin/branches/{id}/deactivate", branch.getId()).with(user(admin.getEmail()).roles("SUPER_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("INACTIVE"));
        assertEquals(BranchStatus.INACTIVE, branches.findById(branch.getId()).orElseThrow().getStatus());

        Branch empty = fixtures.branch();
        mvc.perform(delete("/api/admin/branches/{id}", empty.getId()).with(user(admin.getEmail()).roles("SUPER_ADMIN")))
                .andExpect(status().isNoContent());
    }

    @Test
    void staffApplyToABranchAndItsManagerApprovesThem() throws Exception {
        Branch branch = fixtures.branch();
        User manager = fixtures.user(Role.BRANCH_MANAGER, branch.getId());
        String email = "kitchen-" + UUID.randomUUID() + "@example.com";

        mvc.perform(post("/api/auth/register/staff").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Kitchen Kim\",\"email\":\"" + email + "\",\"phoneNumber\":\"0771234567\","
                                + "\"password\":\"Secret@123\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/register/staff").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Kitchen Kim\",\"email\":\"" + email + "\",\"phoneNumber\":\"0771234567\","
                                + "\"password\":\"Secret@123\",\"branchId\":" + branch.getId() + "}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("PENDING_APPROVAL"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Your account is awaiting branch manager approval"));

        User applicant = users.findByEmail(email).orElseThrow();
        mvc.perform(get("/api/manager/team").with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].email").value(email));

        Branch otherBranch = fixtures.branch();
        User otherManager = fixtures.user(Role.BRANCH_MANAGER, otherBranch.getId());
        mvc.perform(put("/api/manager/team/{id}/approve", applicant.getId())
                        .with(user(otherManager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error").value("NOT_YOUR_TEAM"));
        mvc.perform(put("/api/manager/team/{id}/approve", applicant.getId())
                        .with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"Secret@123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("STAFF"))
                .andExpect(jsonPath("$.branchId").value(branch.getId()))
                .andExpect(jsonPath("$.phoneNumber").value("0771234567"));
        mvc.perform(put("/api/manager/team/{id}/suspend", applicant.getId())
                        .with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("SUSPENDED"));
        assertEquals(UserStatus.SUSPENDED, users.findById(applicant.getId()).orElseThrow().getStatus());
    }

    @Test
    void managerEditsOwnBranchHoursAndMenuButNotOtherBranches() throws Exception {
        Branch branch = fixtures.branch();
        Branch other = fixtures.branch();
        User manager = fixtures.user(Role.BRANCH_MANAGER, branch.getId());

        mvc.perform(put("/api/manager/branch").with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"openingTime\":\"09:00\",\"closingTime\":\"21:00\",\"codEnabled\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.openingTime").value("09:00"))
                .andExpect(jsonPath("$.codEnabled").value(false));
        mvc.perform(post("/api/menu/branch/{id}", branch.getId()).with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuName\":\"Kottu Pizza\",\"category\":\"Pizza\",\"price\":2100.00}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.branchId").value(branch.getId()));
        mvc.perform(post("/api/menu/branch/{id}", other.getId()).with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"menuName\":\"Sneaky\",\"price\":100.00}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/branches").with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminAssignsOnlyActiveBranchesAndApprovesManagers() throws Exception {
        Branch branch = fixtures.branch();
        Branch closed = fixtures.branch();
        closed.setStatus(BranchStatus.INACTIVE);
        branches.save(closed);
        User admin = fixtures.user(Role.SUPER_ADMIN, null);
        User applicant = users.save(new User("New Manager", "mgr-" + UUID.randomUUID() + "@example.com",
                "secret", Role.BRANCH_MANAGER, UserStatus.PENDING_APPROVAL));

        mvc.perform(put("/api/admin/users/{id}/approve", applicant.getId()).with(user(admin.getEmail()).roles("SUPER_ADMIN")))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/admin/users/{id}/assign-branch", applicant.getId())
                        .with(user(admin.getEmail()).roles("SUPER_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"branchId\":" + closed.getId() + "}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/admin/users/{id}/assign-branch", applicant.getId())
                        .with(user(admin.getEmail()).roles("SUPER_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"branchId\":" + branch.getId() + "}"))
                .andExpect(status().isOk());
        mvc.perform(put("/api/admin/users/{id}/approve", applicant.getId()).with(user(admin.getEmail()).roles("SUPER_ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
