package inventory.repository;

import com.example.BigBite.inventory.entity.InventoryItem;
import com.example.BigBite.inventory.entity.InventoryItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {

    List<InventoryItem> findByBranchId(Long branchId);

    List<InventoryItem> findByBranchIdAndIsDiscontinuedFalse(Long branchId);

    List<InventoryItem> findByBranchIdAndCategoryIgnoreCaseAndIsDiscontinuedFalse(Long branchId, String category);

    List<InventoryItem> findByBranchIdAndStatusAndIsDiscontinuedFalse(Long branchId, InventoryItemStatus status);

    Optional<InventoryItem> findByIdAndBranchId(Long id, Long branchId);

    Optional<InventoryItem> findByBranchIdAndItemCodeIgnoreCase(Long branchId, String itemCode);

    Optional<InventoryItem> findByBranchIdAndItemNameIgnoreCase(Long branchId, String itemName);

    Optional<InventoryItem> findByBranchIdAndItemNameIgnoreCaseAndIsDiscontinuedFalse(Long branchId, String itemName);

    boolean existsByBranchIdAndItemCodeIgnoreCase(Long branchId, String itemCode);

    boolean existsByBranchIdAndItemNameIgnoreCaseAndIsDiscontinuedFalse(Long branchId, String itemName);

    @Query("SELECT i FROM InventoryItem i WHERE i.branch.id = :branchId AND i.isDiscontinued = false AND i.quantity <= i.minimumThreshold ORDER BY i.quantity ASC")
    List<InventoryItem> findLowStockItemsByBranchId(@Param("branchId") Long branchId);
}
