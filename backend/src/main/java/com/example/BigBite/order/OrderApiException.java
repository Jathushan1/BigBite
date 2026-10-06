package com.example.BigBite.order;

import com.example.BigBite.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class OrderApiException extends ApiException {
    public OrderApiException(HttpStatus status, String code, String message) {
        super(status, code, message);
    }
}
