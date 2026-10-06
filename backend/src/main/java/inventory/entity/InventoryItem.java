package inventory.entity;

import com.example.BigBite.branch.Branch;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"branch_id", "item_code"})
})
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "item_name", nullable = false)
    private String itemName;

    @Column(name = "item_code", nullable = false)
    private String itemCode;

    @Column(name = "category")
    private String category;

    @Column(name = "quantity", nullable = false)
    private Double quantity = 0.0;

    @Column(name = "unit", nullable = false)
    private String unit = "pcs";

    @Column(name = "minimum_threshold", nullable = false)
    private Double minimumThreshold = 10.0;

    @Column(name = "cost_per_unit", precision = 10, scale = 2)
    private BigDecimal costPerUnit;

    @Column(name = "supplier")
    private String supplier;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private InventoryItemStatus status = InventoryItemStatus.ACTIVE;

    @Column(name = "is_discontinued", nullable = false)
    private boolean isDiscontinued = false;

    @Column(name = "last_restocked_at")
    private LocalDateTime lastRestockedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public InventoryItem() {}

    public InventoryItem(Branch branch, String itemName, String itemCode, String category,
                         Double quantity, String unit, Double minimumThreshold,
                         BigDecimal costPerUnit, String supplier) {
        this.branch = branch;
        this.itemName = itemName;
        this.itemCode = itemCode;
        this.category = category;
        this.quantity = quantity != null ? Math.max(0.0, quantity) : 0.0;
        this.unit = unit != null ? unit : "pcs";
        this.minimumThreshold = minimumThreshold != null ? Math.max(0.0, minimumThreshold) : 10.0;
        this.costPerUnit = costPerUnit;
        this.supplier = supplier;
        this.isDiscontinued = false;
        updateStatus();
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.quantity == null) {
            this.quantity = 0.0;
        }
        if (this.minimumThreshold == null) {
            this.minimumThreshold = 10.0;
        }
        updateStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        updateStatus();
    }

    public void updateStatus() {
        if (this.isDiscontinued) {
            this.status = InventoryItemStatus.DISCONTINUED;
            return;
        }
        if (this.quantity <= 0.0) {
            this.status = InventoryItemStatus.OUT_OF_STOCK;
        } else if (this.quantity <= this.minimumThreshold) {
            this.status = InventoryItemStatus.LOW_STOCK;
        } else {
            this.status = InventoryItemStatus.ACTIVE;
        }
    }

    public void restock(Double amount) {
        if (this.isDiscontinued) {
            throw new IllegalStateException("Cannot restock discontinued inventory item: " + this.itemName);
        }
        if (amount == null || amount <= 0.0) {
            throw new IllegalArgumentException("Restock quantity must be strictly greater than 0");
        }
        this.quantity += amount;
        this.lastRestockedAt = LocalDateTime.now();
        updateStatus();
    }

    public void deduct(Double amount) {
        if (this.isDiscontinued) {
            throw new IllegalStateException("Cannot deduct stock from discontinued inventory item: " + this.itemName);
        }
        if (amount == null || amount <= 0.0) {
            throw new IllegalArgumentException("Deduction quantity must be strictly greater than 0");
        }
        if (this.quantity < amount) {
            throw new IllegalArgumentException(String.format(
                    "Insufficient stock for '%s'. Available: %.2f %s, Requested: %.2f %s",
                    this.itemName, this.quantity, this.unit, amount, this.unit));
        }
        this.quantity -= amount;
        updateStatus();
    }

    public void discontinue() {
        this.isDiscontinued = true;
        this.status = InventoryItemStatus.DISCONTINUED;
    }

    public void reactivate() {
        this.isDiscontinued = false;
        updateStatus();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Branch getBranch() {
        return branch;
    }

    public void setBranch(Branch branch) {
        this.branch = branch;
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
        updateStatus();
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
        updateStatus();
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
        updateStatus();
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
