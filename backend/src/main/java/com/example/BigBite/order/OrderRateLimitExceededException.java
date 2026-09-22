package com.example.BigBite.order;

public class OrderRateLimitExceededException extends RuntimeException {
    public OrderRateLimitExceededException(String message) {
        super(message);
    }
}
