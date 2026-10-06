package com.example.BigBite.order.external;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** Port to the (future) reviews module. The order module decides who may review and when. */
public interface ReviewService {

    record Review(Long orderId, Long branchId, Long customerId, String reviewerName, int rating,
                  String comment, LocalDateTime createdAt) {}

    Review submit(Long orderId, Long branchId, Long customerId, String reviewerName, int rating, String comment);

    Optional<Review> findByOrder(Long orderId);

    List<Review> listForBranch(Long branchId);
}
