package inventory.repository;

import com.example.BigBite.inventory.entity.MenuItemIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemIngredientRepository extends JpaRepository<MenuItemIngredient, Long> {

    List<MenuItemIngredient> findByMenuItemId(Long menuItemId);

    List<MenuItemIngredient> findByInventoryItemId(Long inventoryItemId);

    Optional<MenuItemIngredient> findByMenuItemIdAndInventoryItemId(Long menuItemId, Long inventoryItemId);

    void deleteByMenuItemId(Long menuItemId);
}
