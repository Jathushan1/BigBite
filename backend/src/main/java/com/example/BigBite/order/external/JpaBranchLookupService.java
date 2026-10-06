package com.example.BigBite.order.external;

import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalTime;
import java.util.Optional;

/** Order-module view of the real branch table. */
@Service
@Transactional(readOnly = true)
public class JpaBranchLookupService implements BranchLookupService {

    private final BranchRepository branchRepository;
    private final Clock clock;

    @Autowired
    public JpaBranchLookupService(BranchRepository branchRepository) {
        this(branchRepository, Clock.systemDefaultZone());
    }

    JpaBranchLookupService(BranchRepository branchRepository, Clock clock) {
        this.branchRepository = branchRepository;
        this.clock = clock;
    }

    private Optional<Branch> find(Long branchId) {
        return branchId == null ? Optional.empty() : branchRepository.findById(branchId);
    }

    @Override
    public boolean isBranchOpen(Long branchId) {
        return find(branchId).map(branch -> branch.isOpenAt(LocalTime.now(clock))).orElse(false);
    }

    @Override
    public boolean branchExists(Long branchId) {
        return branchId != null && branchRepository.existsById(branchId);
    }

    @Override
    public boolean supportsTakeaway(Long branchId) {
        return find(branchId).map(Branch::isTakeawayEnabled).orElse(false);
    }

    @Override
    public boolean acceptsCod(Long branchId) {
        return find(branchId).map(Branch::isCodEnabled).orElse(false);
    }

    @Override
    public String getBranchName(Long branchId) {
        return find(branchId).map(Branch::getName).orElse("Branch #" + branchId);
    }

    @Override
    public String getBranchAddress(Long branchId) {
        return find(branchId).map(branch -> branch.getAddress() + ", " + branch.getCity()).orElse(null);
    }
}
