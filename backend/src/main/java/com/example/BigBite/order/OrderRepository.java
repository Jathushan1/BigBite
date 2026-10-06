package com.example.BigBite.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT o FROM Order o WHERE o.status = :placed AND o.paymentStatus IN :pendingStatuses " +
            "AND (o.paymentMethod IS NULL OR o.paymentMethod <> :cod) AND o.createdAt < :cutoff")
    List<Order> findAbandonedCardOrders(@Param("placed") OrderStatus placed,
                                        @Param("pendingStatuses") List<PaymentStatus> pendingStatuses,
                                        @Param("cod") PaymentMethod cod,
                                        @Param("cutoff") LocalDateTime cutoff);

    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<Order> findByBranchIdAndStatusOrderByCreatedAtDesc(Long branchId, OrderStatus status);

    List<Order> findByBranchIdOrderByCreatedAtDesc(Long branchId);

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();

    long countByCustomerIdAndPaymentMethodAndStatus(Long customerId, PaymentMethod paymentMethod, OrderStatus status);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.customerId = :customerId AND o.paymentMethod = :method AND o.status NOT IN :terminalStatuses")
    long countOpenCodOrders(@Param("customerId") Long customerId,
                            @Param("method") PaymentMethod method,
                            @Param("terminalStatuses") List<OrderStatus> terminalStatuses);

    long countByBranchId(Long branchId);

    List<Order> findByBranchIdAndRefundStatusOrderByCreatedAtDesc(Long branchId, RefundStatus refundStatus);

    List<Order> findByRefundStatus(RefundStatus refundStatus);

    List<Order> findByBranchIdAndCancelRequestStatusOrderByCreatedAtDesc(Long branchId, CancelRequestStatus status);

    long countByRiderIdAndStatus(Long riderId, OrderStatus status);

    @Query("SELECT o FROM Order o WHERE o.acceptedAt IS NULL AND o.awaitingAcceptanceSince < :cutoff " +
            "AND (o.status = com.example.BigBite.order.OrderStatus.PAYMENT_VERIFIED OR " +
            "(o.status = com.example.BigBite.order.OrderStatus.PLACED AND o.paymentMethod = com.example.BigBite.order.PaymentMethod.CASH_ON_DELIVERY))")
    List<Order> findUnacceptedSince(@Param("cutoff") LocalDateTime cutoff);
}
