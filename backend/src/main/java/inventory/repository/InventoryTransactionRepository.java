package inventory.repository;

import com.example.BigBite.inventory.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryTransactionRepository extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByBranchIdOrderByTimestampDesc(Long branchId);

    List<InventoryTransaction> findByInventoryItemIdOrderByTimestampDesc(Long inventoryItemId);

    List<InventoryTransaction> findByReferenceOrderNumber(String referenceOrderNumber);
}
