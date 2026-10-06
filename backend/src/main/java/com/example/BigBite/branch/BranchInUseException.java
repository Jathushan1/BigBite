package com.example.BigBite.branch;

import com.example.BigBite.common.exception.ApiException;
import org.springframework.http.HttpStatus;

public class BranchInUseException extends ApiException {
    public BranchInUseException(String message) {
        super(HttpStatus.CONFLICT, "BRANCH_IN_USE", message);
    }
}
