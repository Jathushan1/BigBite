package com.example.BigBite.common.ratelimit;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

/** In-memory sliding-window limiter: at most {@code maxRequests} per key within {@code windowSeconds}. */
public class SlidingWindowRateLimiter {

    private final int maxRequests;
    private final long windowSeconds;
    private final ConcurrentHashMap<String, ConcurrentLinkedDeque<Instant>> requestHistory = new ConcurrentHashMap<>();

    public SlidingWindowRateLimiter(int maxRequests, long windowSeconds) {
        this.maxRequests = maxRequests;
        this.windowSeconds = windowSeconds;
    }

    public boolean tryAcquire(String clientKey) {
        if (clientKey == null || clientKey.isBlank()) {
            clientKey = "anonymous";
        }

        Instant now = Instant.now();
        Instant windowStart = now.minusSeconds(windowSeconds);

        ConcurrentLinkedDeque<Instant> timestamps = requestHistory.computeIfAbsent(clientKey, k -> new ConcurrentLinkedDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxRequests) {
                return false;
            }

            timestamps.addLast(now);
            return true;
        }
    }

    public void reset() {
        requestHistory.clear();
    }
}
