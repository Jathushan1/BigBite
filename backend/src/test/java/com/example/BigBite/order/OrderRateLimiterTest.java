package com.example.BigBite.order;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrderRateLimiterTest {

    private OrderRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        // Allow 2 requests per 60 seconds for testing
        rateLimiter = new OrderRateLimiter(2, 60);
    }

    @Test
    @DisplayName("Allows requests up to the max limit")
    void testRateLimiter_AllowsWithinLimit() {
        assertTrue(rateLimiter.tryAcquire("user:1"));
        assertTrue(rateLimiter.tryAcquire("user:1"));
    }

    @Test
    @DisplayName("Blocks requests exceeding the max limit")
    void testRateLimiter_BlocksExcessRequests() {
        assertTrue(rateLimiter.tryAcquire("user:1"));
        assertTrue(rateLimiter.tryAcquire("user:1"));
        assertFalse(rateLimiter.tryAcquire("user:1"));
    }

    @Test
    @DisplayName("Different users have independent rate limits")
    void testRateLimiter_IndependentLimitsForDifferentUsers() {
        assertTrue(rateLimiter.tryAcquire("user:1"));
        assertTrue(rateLimiter.tryAcquire("user:1"));
        assertFalse(rateLimiter.tryAcquire("user:1"));

        // user:2 should still be allowed
        assertTrue(rateLimiter.tryAcquire("user:2"));
        assertTrue(rateLimiter.tryAcquire("user:2"));
        assertFalse(rateLimiter.tryAcquire("user:2"));
    }

    @Test
    @DisplayName("Reset clears history and allows new requests")
    void testRateLimiter_Reset() {
        assertTrue(rateLimiter.tryAcquire("user:1"));
        assertTrue(rateLimiter.tryAcquire("user:1"));
        assertFalse(rateLimiter.tryAcquire("user:1"));

        rateLimiter.reset();
        assertTrue(rateLimiter.tryAcquire("user:1"));
    }
}
