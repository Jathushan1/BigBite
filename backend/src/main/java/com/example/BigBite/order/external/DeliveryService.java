package com.example.BigBite.order.external;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Port to the (future) delivery module. The order module asks it which riders can take a job,
 * tells it when an order is dispatched or finished, and reads live tracking for the customer.
 */
public interface DeliveryService {

    record RiderAvailability(Long riderId, String name, String phoneNumber, boolean busy, int activeDeliveries) {}

    record Tracking(Long orderId, Long riderId, String riderName, String riderPhone, String stage,
                    int progressPercent, int etaMinutes, LocalDateTime estimatedArrival) {}

    List<RiderAvailability> ridersFor(Long branchId);

    void onDispatched(Long orderId, Long riderId);

    void onDelivered(Long orderId);

    void onDeliveryFailed(Long orderId, String reason);

    /** Null when the order has not been dispatched. */
    Tracking track(Long orderId);
}
