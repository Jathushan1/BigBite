package com.example.BigBite.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedAddressRepository extends JpaRepository<SavedAddress, Long> {

    List<SavedAddress> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    boolean existsByCustomerIdAndAddressLine(Long customerId, String addressLine);
}
