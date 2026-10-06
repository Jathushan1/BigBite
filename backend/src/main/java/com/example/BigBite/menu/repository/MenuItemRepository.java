package com.example.BigBite.menu.repository;

import com.example.BigBite.menu.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {

    List<MenuItem> findByBranchId(Long branchId);

    long countByBranchId(Long branchId);

    List<MenuItem> findByBranchIdAndAvailabilityTrue(Long branchId);
}
