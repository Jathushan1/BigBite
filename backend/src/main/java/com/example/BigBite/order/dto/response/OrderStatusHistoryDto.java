package com.example.BigBite.order.dto.response;

import com.example.BigBite.order.enums.OrderStatus;
import com.example.BigBite.order.entity.OrderStatusHistory;

import java.time.LocalDateTime;

public record OrderStatusHistoryDto(Long id, Long orderId, OrderStatus fromStatus, OrderStatus toStatus,
                                    Long actorId, String actorRole, String note, LocalDateTime changedAt) {
    public static OrderStatusHistoryDto fromEntity(OrderStatusHistory entry) {
        return new OrderStatusHistoryDto(entry.getId(), entry.getOrderId(), entry.getFromStatus(),
                entry.getToStatus(), entry.getActorId(), entry.getActorRole(), entry.getNote(), entry.getChangedAt());
    }
}
