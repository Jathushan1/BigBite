package com.example.BigBite.order.external;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/** Port to the (future) complaints module. */
public interface ComplaintService {

    Set<String> CATEGORIES = Set.of("LATE_DELIVERY", "WRONG_ITEM", "MISSING_ITEM", "FOOD_QUALITY",
            "RIDER_BEHAVIOUR", "PAYMENT_ISSUE", "OTHER");

    record Complaint(Long id, Long orderId, Long branchId, Long customerId, String contactName, String category,
                     String description, String status, LocalDateTime createdAt) {}

    Complaint file(Long orderId, Long branchId, Long customerId, String contactName, String category, String description);

    List<Complaint> listForOrder(Long orderId);

    List<Complaint> listForBranch(Long branchId);
}
