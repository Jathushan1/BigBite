package inventory.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "branch_id", nullable = false)
    private Long branchId;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", nullable = false)
    private TransactionType transactionType;

    @Column(name = "quantity_change", nullable = false)
    private Double quantityChange;

    @Column(name = "previous_quantity", nullable = false)
    private Double previousQuantity;

    @Column(name = "new_quantity", nullable = false)
    private Double newQuantity;

    @Column(name = "reference_order_number")
    private String referenceOrderNumber;

    @Column(name = "reason")
    private String reason;

    @Column(name = "performed_by")
    private String performedBy;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public InventoryTransaction() {}

    public InventoryTransaction(InventoryItem inventoryItem, Long branchId, TransactionType transactionType,
                                Double quantityChange, Double previousQuantity, Double newQuantity,
                                String referenceOrderNumber, String reason, String performedBy) {
        this.inventoryItem = inventoryItem;
        this.branchId = branchId;
        this.transactionType = transactionType;
        this.quantityChange = quantityChange;
        this.previousQuantity = previousQuantity;
        this.newQuantity = newQuantity;
        this.referenceOrderNumber = referenceOrderNumber;
        this.reason = reason;
        this.performedBy = performedBy;
        this.timestamp = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InventoryItem getInventoryItem() {
        return inventoryItem;
    }

    public void setInventoryItem(InventoryItem inventoryItem) {
        this.inventoryItem = inventoryItem;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public TransactionType getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(TransactionType transactionType) {
        this.transactionType = transactionType;
    }

    public Double getQuantityChange() {
        return quantityChange;
    }

    public void setQuantityChange(Double quantityChange) {
        this.quantityChange = quantityChange;
    }

    public Double getPreviousQuantity() {
        return previousQuantity;
    }

    public void setPreviousQuantity(Double previousQuantity) {
        this.previousQuantity = previousQuantity;
    }

    public Double getNewQuantity() {
        return newQuantity;
    }

    public void setNewQuantity(Double newQuantity) {
        this.newQuantity = newQuantity;
    }

    public String getReferenceOrderNumber() {
        return referenceOrderNumber;
    }

    public void setReferenceOrderNumber(String referenceOrderNumber) {
        this.referenceOrderNumber = referenceOrderNumber;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public void setPerformedBy(String performedBy) {
        this.performedBy = performedBy;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
