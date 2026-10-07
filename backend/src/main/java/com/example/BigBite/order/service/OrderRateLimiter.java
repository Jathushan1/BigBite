package com.example.BigBite.order.service;

import com.example.BigBite.common.ratelimit.SlidingWindowRateLimiter;
import org.springframework.stereotype.Component;

@Component
public class OrderRateLimiter extends SlidingWindowRateLimiter {

    public OrderRateLimiter() {
        this(5, 60); // 5 orders per 60 seconds
    }

    public OrderRateLimiter(int maxRequests, long windowSeconds) {
        super(maxRequests, windowSeconds);
    }
}
