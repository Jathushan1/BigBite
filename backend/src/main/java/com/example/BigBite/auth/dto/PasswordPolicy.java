package com.example.BigBite.auth.dto;

/** Shared strong-password rule for registration, reset and change. */
public final class PasswordPolicy {
    private PasswordPolicy() { }

    public static final String REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$";
    public static final String MESSAGE = "Password must be at least 8 characters and include an uppercase letter, "
            + "a lowercase letter, a digit, and a special character (@$!%*?&#)";
}
