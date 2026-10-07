package com.example.BigBite.order.external.mock;

import com.example.BigBite.order.external.ReviewService;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/** In-memory stand-in for the reviews module; data lasts until the server restarts. */
@Component
public class MockReviewService implements ReviewService {

    private final Map<Long, Review> reviews = new ConcurrentHashMap<>();

    @Override
    public Review submit(Long orderId, Long branchId, Long customerId, String reviewerName, int rating, String comment) {
        Review review = new Review(orderId, branchId, customerId, reviewerName, rating, comment, LocalDateTime.now());
        reviews.put(orderId, review);
        return review;
    }

    @Override
    public Optional<Review> findByOrder(Long orderId) {
        return Optional.ofNullable(reviews.get(orderId));
    }

    @Override
    public List<Review> listForBranch(Long branchId) {
        return reviews.values().stream()
                .filter(review -> review.branchId().equals(branchId))
                .sorted(Comparator.comparing(Review::createdAt).reversed())
                .toList();
    }
}
