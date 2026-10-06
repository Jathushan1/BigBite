package com.example.BigBite.order;

import com.example.BigBite.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class OrderRateLimitExceededException extends ApiException {
    public OrderRateLimitExceededException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, "RATE_LIMITED", message);
    }
}
