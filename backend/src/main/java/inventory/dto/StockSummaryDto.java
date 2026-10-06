package inventory.dto;

import java.math.BigDecimal;

public class StockSummaryDto {

    private Long branchId;
    private long totalTrackedItems;
    private double totalQuantity;
    private long lowStockCount;
    private long outOfStockCount;
    private long discontinuedCount;
    private BigDecimal totalInventoryValuation;

    public StockSummaryDto() {}

    public StockSummaryDto(Long branchId, long totalTrackedItems, double totalQuantity,
                           long lowStockCount, long outOfStockCount, long discontinuedCount,
                           BigDecimal totalInventoryValuation) {
        this.branchId = branchId;
        this.totalTrackedItems = totalTrackedItems;
        this.totalQuantity = totalQuantity;
        this.lowStockCount = lowStockCount;
        this.outOfStockCount = outOfStockCount;
        this.discontinuedCount = discontinuedCount;
        this.totalInventoryValuation = totalInventoryValuation;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public long getTotalTrackedItems() {
        return totalTrackedItems;
    }

    public void setTotalTrackedItems(long totalTrackedItems) {
        this.totalTrackedItems = totalTrackedItems;
    }

    public double getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(double totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public long getOutOfStockCount() {
        return outOfStockCount;
    }

    public void setOutOfStockCount(long outOfStockCount) {
        this.outOfStockCount = outOfStockCount;
    }

    public long getDiscontinuedCount() {
        return discontinuedCount;
    }

    public void setDiscontinuedCount(long discontinuedCount) {
        this.discontinuedCount = discontinuedCount;
    }

    public BigDecimal getTotalInventoryValuation() {
        return totalInventoryValuation;
    }

    public void setTotalInventoryValuation(BigDecimal totalInventoryValuation) {
        this.totalInventoryValuation = totalInventoryValuation;
    }
}
