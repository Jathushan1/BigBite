package com.example.BigBite.auth;

public enum Role {
    SUPER_ADMIN,
    BRANCH_MANAGER,
    STAFF,
    DELIVERY_PARTNER,
    CUSTOMER;

    /** Roles that work for a single branch and need approval before they can sign in. */
    public boolean isBranchScopedStaff() {
        return this == BRANCH_MANAGER || this == STAFF || this == DELIVERY_PARTNER;
    }
}
