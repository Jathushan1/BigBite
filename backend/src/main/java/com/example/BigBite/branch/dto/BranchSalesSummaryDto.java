package com.example.BigBite.branch.dto;

import com.example.BigBite.branch.BranchStatus;
import java.math.BigDecimal;

public class BranchSalesSummaryDto {

    private Long branchId;
    private String branchName;
    private String branchCode;
    private String city;
    private BranchStatus status;

    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private long totalOrders = 0;
    private BigDecimal averageOrderValue = BigDecimal.ZERO;
    private double revenuePercentage = 0.0;

    public BranchSalesSummaryDto() {}

    public BranchSalesSummaryDto(Long branchId, String branchName, String branchCode, String city, BranchStatus status, BigDecimal totalRevenue, long totalOrders, BigDecimal averageOrderValue, double revenuePercentage) {
        this.branchId = branchId;
        this.branchName = branchName;
        this.branchCode = branchCode;
        this.city = city;
        this.status = status;
        this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        this.totalOrders = totalOrders;
        this.averageOrderValue = averageOrderValue != null ? averageOrderValue : BigDecimal.ZERO;
        this.revenuePercentage = revenuePercentage;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public void setBranchCode(String branchCode) {
        this.branchCode = branchCode;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public BranchStatus getStatus() {
        return status;
    }

    public void setStatus(BranchStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getTotalOrders() {
        return totalOrders;
    }

    public void setTotalOrders(long totalOrders) {
        this.totalOrders = totalOrders;
    }

    public BigDecimal getAverageOrderValue() {
        return averageOrderValue;
    }

    public void setAverageOrderValue(BigDecimal averageOrderValue) {
        this.averageOrderValue = averageOrderValue;
    }

    public double getRevenuePercentage() {
        return revenuePercentage;
    }

    public void setRevenuePercentage(double revenuePercentage) {
        this.revenuePercentage = revenuePercentage;
    }
}