package com.example.BigBite.auth.exception;

import org.springframework.http.HttpStatus;

public class AccountStatusException extends RuntimeException {

    private final HttpStatus status;

    public AccountStatusException(String message) {
        super(message);
        this.status = HttpStatus.FORBIDDEN;
    }

    public AccountStatusException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
