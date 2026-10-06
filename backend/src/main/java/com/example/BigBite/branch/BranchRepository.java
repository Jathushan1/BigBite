package com.example.BigBite.branch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {

    Optional<Branch> findByBranchCode(String branchCode);

    boolean existsByBranchCode(String branchCode);

    boolean existsByBranchCodeAndIdNot(String branchCode, Long id);

    List<Branch> findByStatus(BranchStatus status);

    long countByStatus(BranchStatus status);
}