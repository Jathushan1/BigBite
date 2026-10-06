package com.example.BigBite.order.external;

import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/** In-memory stand-in for the complaints module; every complaint starts as OPEN. */
@Component
public class MockComplaintService implements ComplaintService {

    private final Map<Long, Complaint> complaints = new ConcurrentHashMap<>();
    private final AtomicLong ids = new AtomicLong();

    @Override
    public Complaint file(Long orderId, Long branchId, Long customerId, String contactName, String category,
                          String description) {
        Complaint complaint = new Complaint(ids.incrementAndGet(), orderId, branchId, customerId, contactName,
                category, description, "OPEN", LocalDateTime.now());
        complaints.put(complaint.id(), complaint);
        return complaint;
    }

    @Override
    public List<Complaint> listForOrder(Long orderId) {
        return complaints.values().stream()
                .filter(complaint -> complaint.orderId().equals(orderId))
                .sorted(Comparator.comparing(Complaint::createdAt))
                .toList();
    }

    @Override
    public List<Complaint> listForBranch(Long branchId) {
        return complaints.values().stream()
                .filter(complaint -> complaint.branchId().equals(branchId))
                .sorted(Comparator.comparing(Complaint::createdAt).reversed())
                .toList();
    }
}
