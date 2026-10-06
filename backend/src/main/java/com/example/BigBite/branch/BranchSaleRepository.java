package com.example.BigBite.branch;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BranchSaleRepository extends JpaRepository<BranchSale, Long> {

    List<BranchSale> findByBranchIdAndSaleDateBetween(Long branchId, LocalDateTime start, LocalDateTime end);

    List<BranchSale> findByBranchIdAndSaleDateBetweenAndStatus(Long branchId, LocalDateTime start, LocalDateTime end, String status);

    List<BranchSale> findBySaleDateBetween(LocalDateTime start, LocalDateTime end);

    List<BranchSale> findBySaleDateBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);

    List<BranchSale> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);

    boolean existsByOrderNumber(String orderNumber);
}
