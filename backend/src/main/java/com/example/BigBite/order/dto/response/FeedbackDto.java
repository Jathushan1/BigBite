package com.example.BigBite.order.dto.response;

import com.example.BigBite.order.external.ComplaintService;
import com.example.BigBite.order.external.ReviewService;

import java.util.List;

/** Review and complaints attached to one order, plus whether the viewer may add more. */
public record FeedbackDto(ReviewService.Review review, List<ComplaintService.Complaint> complaints,
                          boolean canReview, boolean canComplain) {
}
