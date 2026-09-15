package com.example.BigBite.auth.dto;

public class RejectUserRequestDto {

    private String reason;

    public RejectUserRequestDto() {}

    public RejectUserRequestDto(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
