package com.example.BigBite.auth.password;

import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.common.exception.ApiException;
import com.example.BigBite.common.mail.EmailSender;
import com.example.BigBite.common.ratelimit.SlidingWindowRateLimiter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Forgot / reset / change password. Responses never reveal whether an email is registered,
 * tokens are single use and short lived, and every password change ends existing sessions.
 */
@Service
public class PasswordResetService {

    public static final String GENERIC_RESPONSE =
            "If an account exists for that email, a password reset link has been sent.";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailSender emailSender;
    private final SlidingWindowRateLimiter emailLimiter;
    private final SlidingWindowRateLimiter ipLimiter;
    private final SecureRandom random = new SecureRandom();
    private final long ttlMinutes;
    private final String frontendUrl;

    public PasswordResetService(UserRepository userRepository,
                                PasswordResetTokenRepository tokenRepository,
                                PasswordEncoder passwordEncoder,
                                EmailSender emailSender,
                                @Value("${app.auth.reset-token-ttl-minutes:30}") long ttlMinutes,
                                @Value("${app.auth.reset-max-requests:3}") int maxRequests,
                                @Value("${app.auth.reset-max-requests-per-ip:10}") int maxRequestsPerIp,
                                @Value("${app.auth.reset-window-minutes:15}") long windowMinutes,
                                @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.ttlMinutes = ttlMinutes;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        this.emailLimiter = new SlidingWindowRateLimiter(maxRequests, windowMinutes * 60);
        this.ipLimiter = new SlidingWindowRateLimiter(maxRequestsPerIp, windowMinutes * 60);
    }

    @Transactional
    public String requestReset(String email, String clientIp) {
        String trimmed = email == null ? "" : email.trim();
        String normalized = trimmed.toLowerCase(Locale.ROOT);
        if (!ipLimiter.tryAcquire(clientIp) || !emailLimiter.tryAcquire(normalized)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED",
                    "Too many reset requests. Please wait a few minutes and try again.");
        }
        userRepository.findByEmail(trimmed)
                .or(() -> userRepository.findByEmail(normalized))
                .filter(user -> user.getStatus() != UserStatus.REJECTED && user.getStatus() != UserStatus.SUSPENDED)
                .ifPresent(this::issueToken);
        return GENERIC_RESPONSE;
    }

    private void issueToken(User user) {
        LocalDateTime now = LocalDateTime.now();
        for (PasswordResetToken previous : tokenRepository.findByUserIdAndUsedAtIsNull(user.getId())) {
            previous.setUsedAt(now);
        }
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokenRepository.save(new PasswordResetToken(user.getId(), hash(rawToken), now.plusMinutes(ttlMinutes)));

        String link = frontendUrl + "/reset-password?token=" + rawToken;
        emailSender.send(user.getEmail(), "Reset your BigBite password",
                "Hi " + user.getName() + ",\n\nWe received a request to reset your BigBite password. "
                        + "The link below is valid for " + ttlMinutes + " minutes and can be used once. "
                        + "If you did not ask for this, you can ignore this email.", link);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetToken token = tokenRepository.findByTokenHash(hash(rawToken == null ? "" : rawToken.trim()))
                .filter(candidate -> candidate.isUsable(LocalDateTime.now()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN",
                        "This reset link is invalid or has expired. Request a new one."));
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_RESET_TOKEN",
                        "This reset link is invalid or has expired. Request a new one."));
        token.setUsedAt(LocalDateTime.now());
        applyNewPassword(user, newPassword);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Sign in again"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "WRONG_PASSWORD", "Your current password is incorrect");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "PASSWORD_UNCHANGED",
                    "Choose a password different from your current one");
        }
        applyNewPassword(user, newPassword);
    }

    private void applyNewPassword(User user, String newPassword) {
        user.setPassword(passwordEncoder.encode(newPassword));
        // JWT "iat" has second precision; truncate so a token issued right after the change stays valid.
        user.setPasswordChangedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        userRepository.save(user);
        for (PasswordResetToken pending : tokenRepository.findByUserIdAndUsedAtIsNull(user.getId())) {
            pending.setUsedAt(LocalDateTime.now());
        }
    }

    static String hash(String rawToken) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    void resetRateLimits() {
        emailLimiter.reset();
        ipLimiter.reset();
    }
}
