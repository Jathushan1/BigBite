package com.example.BigBite.order.dto;

import jakarta.validation.constraints.Size;

/** Optional note staff attach when approving or declining a cancellation request. */
public record DecisionNoteDto(@Size(max = 255, message = "Note is too long") String note) {
}
