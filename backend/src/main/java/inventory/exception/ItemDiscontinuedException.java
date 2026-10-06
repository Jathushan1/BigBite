package inventory.exception;

public class ItemDiscontinuedException extends RuntimeException {

    private final Long itemId;
    private final String itemName;

    public ItemDiscontinuedException(Long itemId, String itemName) {
        super(String.format("Inventory item '%s' (ID: %d) has been discontinued and cannot undergo stock adjustments or deductions",
                itemName, itemId));
        this.itemId = itemId;
        this.itemName = itemName;
    }

    public ItemDiscontinuedException(String message) {
        super(message);
        this.itemId = null;
        this.itemName = null;
    }

    public Long getItemId() {
        return itemId;
    }

    public String getItemName() {
        return itemName;
    }
}
