package com.example.BigBite.branch.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class FranchiseMonthlySalesReportDto {

    private int year;
    private int month;
    private String monthName;

    private int totalBranches;
    private int activeBranches;
    private int inactiveBranches;

    private BigDecimal totalFranchiseRevenue = BigDecimal.ZERO;
    private long totalFranchiseOrders = 0;
    private BigDecimal franchiseAverageOrderValue = BigDecimal.ZERO;

    private String topPerformingBranchName;
    private BigDecimal topPerformingBranchRevenue = BigDecimal.ZERO;

    private List<BranchSalesSummaryDto> branchSummaries = new ArrayList<>();

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime generatedAt;

    public FranchiseMonthlySalesReportDto() {
        this.generatedAt = LocalDateTime.now();
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

    public int getTotalBranches() {
        return totalBranches;
    }

    public void setTotalBranches(int totalBranches) {
        this.totalBranches = totalBranches;
    }

    public int getActiveBranches() {
        return activeBranches;
    }

    public void setActiveBranches(int activeBranches) {
        this.activeBranches = activeBranches;
    }

    public int getInactiveBranches() {
        return inactiveBranches;
    }

    public void setInactiveBranches(int inactiveBranches) {
        this.inactiveBranches = inactiveBranches;
    }

    public BigDecimal getTotalFranchiseRevenue() {
        return totalFranchiseRevenue;
    }

    public void setTotalFranchiseRevenue(BigDecimal totalFranchiseRevenue) {
        this.totalFranchiseRevenue = totalFranchiseRevenue;
    }

    public long getTotalFranchiseOrders() {
        return totalFranchiseOrders;
    }

    public void setTotalFranchiseOrders(long totalFranchiseOrders) {
        this.totalFranchiseOrders = totalFranchiseOrders;
    }

    public BigDecimal getFranchiseAverageOrderValue() {
        return franchiseAverageOrderValue;
    }

    public void setFranchiseAverageOrderValue(BigDecimal franchiseAverageOrderValue) {
        this.franchiseAverageOrderValue = franchiseAverageOrderValue;
    }

    public String getTopPerformingBranchName() {
        return topPerformingBranchName;
    }

    public void setTopPerformingBranchName(String topPerformingBranchName) {
        this.topPerformingBranchName = topPerformingBranchName;
    }

    public BigDecimal getTopPerformingBranchRevenue() {
        return topPerformingBranchRevenue;
    }

    public void setTopPerformingBranchRevenue(BigDecimal topPerformingBranchRevenue) {
        this.topPerformingBranchRevenue = topPerformingBranchRevenue;
    }

    public List<BranchSalesSummaryDto> getBranchSummaries() {
        return branchSummaries;
    }

    public void setBranchSummaries(List<BranchSalesSummaryDto> branchSummaries) {
        this.branchSummaries = branchSummaries;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }
}
