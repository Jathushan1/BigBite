package com.example.BigBite.branch.dto;

import com.example.BigBite.branch.BranchStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MonthlyBranchSalesReportDto {

    private Long branchId;
    private String branchName;
    private String branchCode;
    private String city;
    private BranchStatus status;

    private int year;
    private int month;
    private String monthName;

    private BigDecimal totalRevenue = BigDecimal.ZERO;
    private long totalOrders = 0;
    private BigDecimal averageOrderValue = BigDecimal.ZERO;
    private BigDecimal highestSingleSale = BigDecimal.ZERO;

    private Map<String, BigDecimal> revenueByPaymentMethod = new HashMap<>();
    private List<DailySalesDto> dailyBreakdown = new ArrayList<>();

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime generatedAt;

    public MonthlyBranchSalesReportDto() {
        this.generatedAt = LocalDateTime.now();
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

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public int getMonth() {
        return month;
    }

    public void setMonth(int month) {
        this.month = month;
    }

    public String getMonthName() {
        return monthName;
    }

    public void setMonthName(String monthName) {
        this.monthName = monthName;
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

    public BigDecimal getHighestSingleSale() {
        return highestSingleSale;
    }

    public void setHighestSingleSale(BigDecimal highestSingleSale) {
        this.highestSingleSale = highestSingleSale;
    }

    public Map<String, BigDecimal> getRevenueByPaymentMethod() {
        return revenueByPaymentMethod;
    }

    public void setRevenueByPaymentMethod(Map<String, BigDecimal> revenueByPaymentMethod) {
        this.revenueByPaymentMethod = revenueByPaymentMethod;
    }

    public List<DailySalesDto> getDailyBreakdown() {
        return dailyBreakdown;
    }

    public void setDailyBreakdown(List<DailySalesDto> dailyBreakdown) {
        this.dailyBreakdown = dailyBreakdown;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
