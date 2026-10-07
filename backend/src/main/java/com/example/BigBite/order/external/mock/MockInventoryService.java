package com.example.BigBite.order.external.mock;

import com.example.BigBite.order.external.InventoryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * In-memory stand-in for the inventory module. Stock is unlimited, except for menu item ids listed in
 * {@code bigbite.mock.inventory.out-of-stock-items}, which lets a demo show the out-of-stock path.
 */
@Component
public class MockInventoryService implements InventoryService {

    private static final Logger log = LoggerFactory.getLogger(MockInventoryService.class);

    private final Set<Long> outOfStock;
    private final Map<Long, List<OrderLine>> reservations = new ConcurrentHashMap<>();

    public MockInventoryService(@Value("${bigbite.mock.inventory.out-of-stock-items:}") String outOfStockItems) {
        this.outOfStock = Arrays.stream(outOfStockItems.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(Long::valueOf)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    public boolean canReserve(Long branchId, List<OrderLine> lines) {
        return lines.stream().noneMatch(line -> outOfStock.contains(line.menuItemId()));
    }

    @Override
    public void reserve(Long orderId, Long branchId, List<OrderLine> lines) {
        reservations.put(orderId, List.copyOf(lines));
    }

    @Override
    public void release(Long orderId) {
        reservations.remove(orderId);
    }

    @Override
    public void consume(Long orderId) {
        reservations.remove(orderId);
    }

    @Override
    public void recordWaste(Long orderId, String reason) {
        log.info("[mock-inventory] order {} food written off: {}", orderId, reason);
    }

    Map<Long, List<OrderLine>> reservations() {
        return reservations;
    }
}
