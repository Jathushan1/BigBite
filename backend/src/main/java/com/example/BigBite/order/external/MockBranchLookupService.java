package com.example.BigBite.order.external;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class MockBranchLookupService implements BranchLookupService {

    public record BranchRecord(Long id, String name, String address, boolean open, boolean takeaway) {}

    private static final Map<Long, BranchRecord> BRANCHES = Map.of(
            1L, new BranchRecord(1L, "Colombo Branch", "42 Galle Road, Colombo 03", true, true),
            2L, new BranchRecord(2L, "Jaffna Branch", "15 Hospital Road, Jaffna", false, false),
            3L, new BranchRecord(3L, "Kandy Branch", "88 Peradeniya Road, Kandy", true, true)
    );

    @Override
    public boolean isBranchOpen(Long branchId) {
        BranchRecord branch = BRANCHES.get(branchId);
        return branch != null && branch.open();
    }

    @Override
    public boolean branchExists(Long branchId) {
        return BRANCHES.containsKey(branchId);
    }

    @Override
    public boolean supportsTakeaway(Long branchId) {
        BranchRecord branch = BRANCHES.get(branchId);
        return branch != null && branch.takeaway();
    }

    @Override
    public String getBranchName(Long branchId) {
        BranchRecord branch = BRANCHES.get(branchId);
        return branch != null ? branch.name() : "Branch #" + branchId;
    }

    @Override
    public String getBranchAddress(Long branchId) {
        BranchRecord branch = BRANCHES.get(branchId);
        return branch != null ? branch.address() : null;
    }
}
