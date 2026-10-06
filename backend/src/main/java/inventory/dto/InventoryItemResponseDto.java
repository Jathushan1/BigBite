package inventory.dto;

import com.example.BigBite.inventory.entity.InventoryItem;
import com.example.BigBite.inventory.entity.InventoryItemStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class InventoryItemResponseDto {

    private Long id;
    private Long branchId;
    private String branchName;
    private String itemName;
    private String itemCode;
    private String category;
    private Double quantity;
    private String unit;
    private Double minimumThreshold;
    private BigDecimal costPerUnit;
    private String supplier;
    private InventoryItemStatus status;
    private boolean isDiscontinued;
    private boolean isLowStock;
    private LocalDateTime lastRestockedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public InventoryItemResponseDto() {}

    public static InventoryItemResponseDto fromEntity(InventoryItem item) {
        if (item == null) return null;
        InventoryItemResponseDto dto = new InventoryItemResponseDto();
        dto.setId(item.getId());
        if (item.getBranch() != null) {
            dto.setBranchId(item.getBranch().getId());
            dto.setBranchName(item.getBranch().getName());
        }
        dto.setItemName(item.getItemName());
        dto.setItemCode(item.getItemCode());
        dto.setCategory(item.getCategory());
        dto.setQuantity(item.getQuantity());
        dto.setUnit(item.getUnit());
        dto.setMinimumThreshold(item.getMinimumThreshold());
        dto.setCostPerUnit(item.getCostPerUnit());
        dto.setSupplier(item.getSupplier());
        dto.setStatus(item.getStatus());
        dto.setDiscontinued(item.isDiscontinued());
        dto.setLowStock(!item.isDiscontinued() && item.getQuantity() != null && item.getMinimumThreshold() != null
                && item.getQuantity() <= item.getMinimumThreshold());
        dto.setLastRestockedAt(item.getLastRestockedAt());
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getItemCode() {
        return itemCode;
    }

    public void setItemCode(String itemCode) {
        this.itemCode = itemCode;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public Double getMinimumThreshold() {
        return minimumThreshold;
    }

    public void setMinimumThreshold(Double minimumThreshold) {
        this.minimumThreshold = minimumThreshold;
    }

    public BigDecimal getCostPerUnit() {
        return costPerUnit;
    }

    public void setCostPerUnit(BigDecimal costPerUnit) {
        this.costPerUnit = costPerUnit;
    }

    public String getSupplier() {
        return supplier;
    }

    public void setSupplier(String supplier) {
        this.supplier = supplier;
    }

    public InventoryItemStatus getStatus() {
        return status;
    }

    public void setStatus(InventoryItemStatus status) {
        this.status = status;
    }

    public boolean isDiscontinued() {
        return isDiscontinued;
    }

    public void setDiscontinued(boolean discontinued) {
        isDiscontinued = discontinued;
    }

    public boolean isLowStock() {
        return isLowStock;
    }

    public void setLowStock(boolean lowStock) {
        isLowStock = lowStock;
    }

    public LocalDateTime getLastRestockedAt() {
        return lastRestockedAt;
    }

    public void setLastRestockedAt(LocalDateTime lastRestockedAt) {
        this.lastRestockedAt = lastRestockedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
