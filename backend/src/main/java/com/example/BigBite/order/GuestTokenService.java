package com.example.BigBite.order;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class GuestTokenService {
    private final byte[] secret;
    private final SecureRandom random = new SecureRandom();

    public GuestTokenService(@Value("${bigbite.guest-token-secret:${jwt.secret}}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String newNonce() {
        byte[] bytes = new byte[24];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String tokenFor(Order order) {
        if (order.getCustomerId() != null || order.getId() == null || order.getGuestAccessNonce() == null) {
            throw new IllegalStateException("This order has no guest access token");
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            byte[] signature = mac.doFinal((order.getId() + ":" + order.getGuestAccessNonce()).getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new IllegalStateException("Could not create guest access token", e);
        }
    }

    public boolean matches(Order order, String presentedToken) {
        if (presentedToken == null || presentedToken.isBlank() || order.getCustomerId() != null
                || order.getGuestAccessNonce() == null) {
            return false;
        }
        byte[] expected = tokenFor(order).getBytes(StandardCharsets.UTF_8);
        byte[] provided = presentedToken.trim().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, provided);
    }
}
