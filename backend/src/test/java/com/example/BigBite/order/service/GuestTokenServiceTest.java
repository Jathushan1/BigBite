package com.example.BigBite.order.service;

import com.example.BigBite.order.entity.Order;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GuestTokenServiceTest {
    private final GuestTokenService tokens = new GuestTokenService("test-secret-for-guest-access");

    @Test
    void tokenIsBoundToOneOrderAndRevokedWhenClaimed() {
        Order first = new Order();
        first.setId(10L);
        first.setGuestAccessNonce(tokens.newNonce());
        Order second = new Order();
        second.setId(11L);
        second.setGuestAccessNonce(tokens.newNonce());
        String token = tokens.tokenFor(first);

        assertTrue(tokens.matches(first, token));
        assertFalse(tokens.matches(second, token));
        assertFalse(tokens.matches(first, "wrong-token"));
        first.setCustomerId(3L);
        assertFalse(tokens.matches(first, token));
    }

    @Test
    void oldGuestOrderRequiresSupportRecovery() {
        Order legacy = new Order();
        legacy.setId(20L);
        legacy.setGuestPhone("0771234567");
        assertFalse(tokens.matches(legacy, "0771234567"));
    }
}
