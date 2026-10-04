package com.example.BigBite.auth;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@bigbite.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        List<User> superAdmins = userRepository.findByRole(Role.SUPER_ADMIN);
        if (superAdmins.isEmpty()) {
            log.info("No SUPER_ADMIN found. Seeding initial super admin: {}", adminEmail);
            User admin = new User(
                    "Super Admin",
                    adminEmail,
                    passwordEncoder.encode(adminPassword),
                    Role.SUPER_ADMIN,
                    UserStatus.ACTIVE
            );
            userRepository.save(admin);
            log.info("Default SUPER_ADMIN seeded successfully with email: {}", adminEmail);
        }
    }
}
