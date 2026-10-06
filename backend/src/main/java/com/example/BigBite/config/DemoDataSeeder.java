package com.example.BigBite.config;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchRepository;
import com.example.BigBite.menu.entity.MenuItem;
import com.example.BigBite.menu.repository.MenuItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Seeds a ready-to-demo franchise when {@code app.seed-demo=true} and there are no branches yet:
 * three branches with menus, plus an approved manager, staff member and rider per branch and one customer.
 * Credentials are documented in README.md and .env.example.
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    private static final String IMG = "https://images.unsplash.com/%s?auto=format&fit=crop&w=600&q=70";

    private final BranchRepository branchRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;

    public DemoDataSeeder(BranchRepository branchRepository, MenuItemRepository menuItemRepository,
                          UserRepository userRepository, PasswordEncoder passwordEncoder,
                          @Value("${app.seed-demo:false}") boolean enabled) {
        this.branchRepository = branchRepository;
        this.menuItemRepository = menuItemRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
    }

    private record Dish(String name, String category, String description, String price, String photoId) {}

    private static final List<Dish> MENU = List.of(
            new Dish("Margherita Pizza", "Pizza", "San Marzano tomato, fresh mozzarella and basil on a stone-baked crust.", "1850.00", "photo-1574071318508-1cdbab80d002"),
            new Dish("Pepperoni Feast", "Pizza", "Double pepperoni, mozzarella and oregano.", "2350.00", "photo-1513104890138-7c749659a591"),
            new Dish("Devilled Chicken Pizza", "Pizza", "Spicy Sri Lankan devilled chicken, onions and capsicum.", "2450.00", "photo-1565299624946-b28f40a0ae38"),
            new Dish("Classic Beef Burger", "Burgers", "Grilled beef patty, cheddar, lettuce, tomato and house sauce.", "1650.00", "photo-1568901346375-23c9450c58cd"),
            new Dish("Crispy Fried Chicken (4 pcs)", "Chicken", "Buttermilk-marinated chicken fried golden.", "1950.00", "photo-1626082927389-6cd097cdc6ec"),
            new Dish("Grilled Cheese Sandwich", "Sides", "Toasted sourdough with three cheeses and dips.", "950.00", "photo-1528735602780-2552fd46c7af"),
            new Dish("Loaded Cheese Fries", "Sides", "Fries with cheese sauce, herbs and chilli flakes.", "850.00", "photo-1573080496219-bb080dd4f877"),
            new Dish("Garden Salad Bowl", "Salads", "Avocado, chickpeas, cherry tomatoes and greens.", "1100.00", "photo-1512621776951-a57141f2eefd"),
            new Dish("Chocolate Oreo Parfait", "Desserts", "Layers of chocolate mousse, cream and Oreo crumble.", "750.00", "photo-1563805042-7684c019e1cb"),
            new Dish("Coca-Cola 330ml", "Beverages", "Ice-cold can.", "300.00", "photo-1622483767028-3f66f32aef97"));

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled || branchRepository.count() > 0) {
            return;
        }
        log.info("Seeding BigBite demo data (app.seed-demo=true and no branches yet)");

        Branch colombo = branch("BigBite Colombo 03", "CMB03", "42 Galle Road", "Colombo", "0112345678",
                "colombo@bigbite.lk", null, null, true, true);
        Branch kandy = branch("BigBite Kandy", "KDY01", "88 Peradeniya Road", "Kandy", "0812345678",
                "kandy@bigbite.lk", LocalTime.of(8, 0), LocalTime.of(23, 30), true, true);
        Branch galle = branch("BigBite Galle Fort", "GLE01", "15 Church Street", "Galle", "0912345678",
                "galle@bigbite.lk", LocalTime.of(10, 0), LocalTime.of(22, 0), false, false);

        for (Branch branch : List.of(colombo, kandy, galle)) {
            for (Dish dish : MENU) {
                MenuItem item = new MenuItem();
                item.setMenuName(dish.name());
                item.setCategory(dish.category());
                item.setDescription(dish.description());
                item.setPrice(new BigDecimal(dish.price()));
                item.setPhoto(String.format(IMG, dish.photoId()));
                item.setAvailability(true);
                item.setBranch(branch);
                menuItemRepository.save(item);
            }
            String slug = branch.getBranchCode().toLowerCase();
            staffUser("Manager " + branch.getCity(), "manager." + slug + "@bigbite.lk", "Manager@123",
                    Role.BRANCH_MANAGER, branch.getId());
            staffUser("Staff " + branch.getCity(), "staff." + slug + "@bigbite.lk", "Staff@123",
                    Role.STAFF, branch.getId());
            staffUser("Rider " + branch.getCity(), "rider." + slug + "@bigbite.lk", "Rider@123",
                    Role.DELIVERY_PARTNER, branch.getId());
        }

        if (!userRepository.existsByEmail("customer@bigbite.lk")) {
            userRepository.save(new User("Demo Customer", "customer@bigbite.lk", "0771234567",
                    passwordEncoder.encode("Customer@123"), Role.CUSTOMER, UserStatus.ACTIVE));
        }
        log.info("Demo data ready: 3 branches, {} menu items, team accounts per branch, customer@bigbite.lk",
                MENU.size() * 3);
    }

    private Branch branch(String name, String code, String address, String city, String phone, String email,
                          LocalTime opens, LocalTime closes, boolean takeaway, boolean cod) {
        Branch branch = new Branch(name, code, address, city, phone, email);
        branch.setOpeningTime(opens);
        branch.setClosingTime(closes);
        branch.setTakeawayEnabled(takeaway);
        branch.setCodEnabled(cod);
        return branchRepository.save(branch);
    }

    private void staffUser(String name, String email, String password, Role role, Long branchId) {
        if (userRepository.existsByEmail(email)) {
            return;
        }
        User user = new User(name, email, "0770000000", passwordEncoder.encode(password), role, UserStatus.APPROVED);
        user.setBranchId(branchId);
        user.setApprovedAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
