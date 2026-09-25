package com.example.BigBite.config;

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
        if (branch.getName() == null || branch.getName().isBlank()) {
            throw new IllegalArgumentException("Branch name is required.");
        }
        if (branch.getAddress() == null || branch.getAddress().isBlank()) {
            throw new IllegalArgumentException("Branch address is required.");
        }
        branch.setStatus("ACTIVE");
        return branchRepository.save(branch);
    }

    public Branch updateBranch(Long id, Branch updated) {
        Branch branch = getBranchById(id);
        if (updated.getName() != null && !updated.getName().isBlank()) {
            branch.setName(updated.getName().trim());
        }
        if (updated.getAddress() != null && !updated.getAddress().isBlank()) {
            branch.setAddress(updated.getAddress().trim());
        }
        if (updated.getContact() != null && !updated.getContact().isBlank()) {
            branch.setContact(updated.getContact().trim());
        }
        if (updated.getStatus() != null && !updated.getStatus().isBlank()) {
            branch.setStatus(updated.getStatus().toUpperCase().trim());
        }
        return branchRepository.save(branch);
    }

    public Branch toggleStatus(Long id) {
        Branch branch = getBranchById(id);
        if ("ACTIVE".equalsIgnoreCase(branch.getStatus())) {
            branch.setStatus("INACTIVE");
        } else {
            branch.setStatus("ACTIVE");
        }
        return branchRepository.save(branch);
    }
}