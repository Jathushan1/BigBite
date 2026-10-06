package inventory.exception;

public class InsufficientStockException extends RuntimeException {

    private final String itemName;
    private final Double availableQuantity;
    private final Double requestedQuantity;
    private final String unit;

    public InsufficientStockException(String itemName, Double availableQuantity, Double requestedQuantity, String unit) {
        super(String.format("Insufficient stock for '%s'. Available: %.2f %s, Requested: %.2f %s",
                itemName, availableQuantity != null ? availableQuantity : 0.0, unit,
                requestedQuantity != null ? requestedQuantity : 0.0, unit));
        this.itemName = itemName;
        this.availableQuantity = availableQuantity;
        this.requestedQuantity = requestedQuantity;
        this.unit = unit;
    }

    public InsufficientStockException(String message) {
        super(message);
        this.itemName = null;
        this.availableQuantity = null;
        this.requestedQuantity = null;
        this.unit = null;
    }

    public String getItemName() {
        return itemName;
    }

    public Double getAvailableQuantity() {
        return availableQuantity;
    }

    public Double getRequestedQuantity() {
        return requestedQuantity;
    }

    public String getUnit() {
        return unit;
    }
}
