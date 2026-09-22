package com.example.BigBite.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    @Query("SELECT o FROM Order o WHERE o.customerId IS NULL AND ((:email IS NOT NULL AND o.guestEmail IS NOT NULL AND LOWER(o.guestEmail) = LOWER(:email)) OR (:phone IS NOT NULL AND o.guestPhone IS NOT NULL AND o.guestPhone = :phone))")
    List<Order> findUnclaimedGuestOrders(@Param("email") String email, @Param("phone") String phone);

    List<Order> findByStatusAndPaymentStatusAndCreatedAtBefore(OrderStatus status, PaymentStatus paymentStatus, LocalDateTime cutoff);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, OrderStatus status);

    List<Order> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();
}
