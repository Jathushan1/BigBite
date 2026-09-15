package com.example.BigBite.order.external;

public interface BranchLookupService {
    boolean isBranchOpen(Long branchId);
    boolean branchExists(Long branchId);
    boolean supportsTakeaway(Long branchId);
}
