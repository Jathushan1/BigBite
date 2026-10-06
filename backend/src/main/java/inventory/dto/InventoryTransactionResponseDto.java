package inventory.dto;

import com.example.BigBite.inventory.entity.InventoryTransaction;
import com.example.BigBite.inventory.entity.TransactionType;

import java.time.LocalDateTime;

public class InventoryTransactionResponseDto {

    private Long id;
    private Long inventoryItemId;
    private String itemName;
    private Long branchId;
    private TransactionType transactionType;
    private Double quantityChange;
    private Double previousQuantity;
    private Double newQuantity;
    private String referenceOrderNumber;
    private String reason;
    private String performedBy;
    private LocalDateTime timestamp;

    public InventoryTransactionResponseDto() {}

    public static InventoryTransactionResponseDto fromEntity(InventoryTransaction tx) {
        if (tx == null) return null;
        InventoryTransactionResponseDto dto = new InventoryTransactionResponseDto();
        dto.setId(tx.getId());
        if (tx.getInventoryItem() != null) {
            dto.setInventoryItemId(tx.getInventoryItem().getId());
            dto.setItemName(tx.getInventoryItem().getItemName());
        }
        dto.setBranchId(tx.getBranchId());
        dto.setTransactionType(tx.getTransactionType());
        dto.setQuantityChange(tx.getQuantityChange());
        dto.setPreviousQuantity(tx.getPreviousQuantity());
        dto.setNewQuantity(tx.getNewQuantity());
        dto.setReferenceOrderNumber(tx.getReferenceOrderNumber());
        dto.setReason(tx.getReason());
        dto.setPerformedBy(tx.getPerformedBy());
        dto.setTimestamp(tx.getTimestamp());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getInventoryItemId() {
        return inventoryItemId;
    }

    public void setInventoryItemId(Long inventoryItemId) {
        this.inventoryItemId = inventoryItemId;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
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
