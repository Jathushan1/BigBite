package com.example.BigBite.order.dto;

import java.util.List;

public class ClaimOrdersResponseDto {

    private int claimedCount;
    private List<Long> claimedOrderIds;
    private String message;

    public ClaimOrdersResponseDto() {
    }

    public ClaimOrdersResponseDto(int claimedCount, List<Long> claimedOrderIds, String message) {
        this.claimedCount = claimedCount;
        this.claimedOrderIds = claimedOrderIds;
        this.message = message;
    }

    public int getClaimedCount() {
        return claimedCount;
    }

    public void setClaimedCount(int claimedCount) {
        this.claimedCount = claimedCount;
    }

    public List<Long> getClaimedOrderIds() {
        return claimedOrderIds;
    }

    public void setClaimedOrderIds(List<Long> claimedOrderIds) {
        this.claimedOrderIds = claimedOrderIds;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
