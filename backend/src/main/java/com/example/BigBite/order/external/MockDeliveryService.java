package com.example.BigBite.order.external;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.order.Order;
import com.example.BigBite.order.OrderRepository;
import com.example.BigBite.order.OrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Stand-in for the delivery module. Riders are the approved DELIVERY_PARTNER users of the branch;
 * tracking is simulated from the dispatch time and a fixed trip length.
 */
@Component
@Transactional(readOnly = true)
public class MockDeliveryService implements DeliveryService {

    private static final Logger log = LoggerFactory.getLogger(MockDeliveryService.class);

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final int tripMinutes;

    public MockDeliveryService(UserRepository userRepository, OrderRepository orderRepository,
                               @Value("${bigbite.mock.delivery.trip-minutes:25}") int tripMinutes) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.tripMinutes = tripMinutes;
    }

    @Override
    public List<RiderAvailability> ridersFor(Long branchId) {
        return userRepository.findByRoleAndBranchIdAndStatus(Role.DELIVERY_PARTNER, branchId, UserStatus.APPROVED)
                .stream()
                .map(rider -> {
                    int active = (int) orderRepository.countByRiderIdAndStatus(rider.getId(), OrderStatus.OUT_FOR_DELIVERY);
                    return new RiderAvailability(rider.getId(), rider.getName(), rider.getPhoneNumber(), active > 0, active);
                })
                .sorted(Comparator.comparing(RiderAvailability::activeDeliveries).thenComparing(RiderAvailability::name))
                .toList();
    }

    @Override
    public void onDispatched(Long orderId, Long riderId) {
        log.info("[mock-delivery] order {} handed to rider {}", orderId, riderId);
    }

    @Override
    public void onDelivered(Long orderId) {
        log.info("[mock-delivery] order {} delivered", orderId);
    }

    @Override
    public void onDeliveryFailed(Long orderId, String reason) {
        log.info("[mock-delivery] order {} delivery failed: {}", orderId, reason);
    }

    @Override
    public Tracking track(Long orderId) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getRiderId() == null || order.getDispatchedAt() == null) {
            return null;
        }
        User rider = userRepository.findById(order.getRiderId()).orElse(null);
        LocalDateTime eta = order.getDispatchedAt().plusMinutes(tripMinutes);
        String stage;
        int progress;
        int etaMinutes;
        if (order.getStatus() == OrderStatus.OUT_FOR_DELIVERY) {
            long elapsed = Duration.between(order.getDispatchedAt(), LocalDateTime.now()).toSeconds();
            progress = (int) Math.min(95, Math.max(5, elapsed * 100 / (tripMinutes * 60L)));
            etaMinutes = (int) Math.max(1, Duration.between(LocalDateTime.now(), eta).toMinutes());
            stage = progress < 30 ? "PICKED_UP" : progress < 80 ? "ON_THE_WAY" : "ARRIVING";
        } else if (order.getStatus() == OrderStatus.DELIVERY_FAILED) {
            progress = 100;
            etaMinutes = 0;
            stage = "FAILED";
        } else {
            progress = 100;
            etaMinutes = 0;
            stage = "DELIVERED";
        }
        return new Tracking(orderId, order.getRiderId(), rider != null ? rider.getName() : "Rider",
                rider != null ? rider.getPhoneNumber() : null, stage, progress, etaMinutes, eta);
    }
}
