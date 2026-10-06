package inventory.exception;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.example.BigBite.inventory")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class InventoryExceptionHandler {

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientStock(InsufficientStockException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Insufficient Stock");
        body.put("message", ex.getMessage());
        if (ex.getItemName() != null) {
            body.put("itemName", ex.getItemName());
            body.put("availableQuantity", ex.getAvailableQuantity());
            body.put("requestedQuantity", ex.getRequestedQuantity());
            body.put("unit", ex.getUnit());
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ItemDiscontinuedException.class)
    public ResponseEntity<Map<String, Object>> handleItemDiscontinued(ItemDiscontinuedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Item Discontinued");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
