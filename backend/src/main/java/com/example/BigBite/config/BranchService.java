package com.example.BigBite.service;

import com.example.BigBite.model.Branch;
import com.example.BigBite.repository.BranchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BranchService {

    @Autowired
    private BranchRepository branchRepository;

    public List<Branch> getAllBranches() {
        return branchRepository.findAll();
    }

    public List<Branch> getActiveBranches() {
        return branchRepository.findByStatus("ACTIVE");
    }

    public Branch getBranchById(Long id) {
        return branchRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Branch not found with id: " + id));
    }

    public Branch createBranch(Branch branch) {
        if (branch.getName() == null || branch.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Branch name is required");
        }
        return branchRepository.save(branch);
    }

    public Branch updateBranch(Long id, Branch updated) {
        Branch existing = getBranchById(id);
        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getAddress() != null) existing.setAddress(updated.getAddress());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getCity() != null) existing.setCity(updated.getCity());
        return branchRepository.save(existing);
    }

    public Branch toggleStatus(Long id) {
        Branch existing = getBranchById(id);
        existing.setStatus("ACTIVE".equalsIgnoreCase(existing.getStatus()) ? "INACTIVE" : "ACTIVE");
        return branchRepository.save(existing);
    }
}