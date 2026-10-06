package com.example.BigBite.branch;

import com.example.BigBite.auth.exception.ResourceNotFoundException;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.menu.repository.MenuItemRepository;
import com.example.BigBite.order.OrderRepository;
import com.example.BigBite.branch.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final BranchSaleRepository branchSaleRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public BranchService(BranchRepository branchRepository, BranchSaleRepository branchSaleRepository,
                         MenuItemRepository menuItemRepository, OrderRepository orderRepository,
                         UserRepository userRepository) {
        this.branchRepository = branchRepository;
        this.branchSaleRepository = branchSaleRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BranchDto createBranch(CreateBranchRequestDto request) {
        String trimmedCode = request.getBranchCode().trim().toUpperCase();
        if (branchRepository.existsByBranchCode(trimmedCode)) {
            throw new IllegalArgumentException("Branch code already exists: " + trimmedCode);
        }

        Branch branch = new Branch();
        branch.setName(request.getName().trim());
        branch.setBranchCode(trimmedCode);
        branch.setAddress(request.getAddress().trim());
        branch.setCity(request.getCity().trim());
        branch.setState(request.getState() != null ? request.getState().trim() : null);
        branch.setPostalCode(request.getPostalCode() != null ? request.getPostalCode().trim() : null);
        branch.setPhone(request.getPhone().trim());
        branch.setEmail(request.getEmail().trim().toLowerCase());
        branch.setStatus(BranchStatus.ACTIVE);
        branch.setOpeningTime(request.getOpeningTime());
        branch.setClosingTime(request.getClosingTime());
        branch.setTakeawayEnabled(request.getTakeawayEnabled() == null || request.getTakeawayEnabled());
        branch.setCodEnabled(request.getCodEnabled() == null || request.getCodEnabled());

        Branch saved = branchRepository.save(branch);
        return BranchDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public BranchDto getBranchById(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
        return BranchDto.fromEntity(branch);
    }

    @Transactional
    public BranchDto updateBranch(Long id, UpdateBranchRequestDto request) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));

        if (request.getBranchCode() != null && !request.getBranchCode().isBlank()) {
            String updatedCode = request.getBranchCode().trim().toUpperCase();
            if (branchRepository.existsByBranchCodeAndIdNot(updatedCode, id)) {
                throw new IllegalArgumentException("Branch code already in use: " + updatedCode);
            }
            branch.setBranchCode(updatedCode);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            branch.setName(request.getName().trim());
        }
        if (request.getAddress() != null && !request.getAddress().isBlank()) {
            branch.setAddress(request.getAddress().trim());
        }
        if (request.getCity() != null && !request.getCity().isBlank()) {
            branch.setCity(request.getCity().trim());
        }
        if (request.getState() != null) {
            branch.setState(request.getState().trim());
        }
        if (request.getPostalCode() != null) {
            branch.setPostalCode(request.getPostalCode().trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            branch.setPhone(request.getPhone().trim());
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            branch.setEmail(request.getEmail().trim().toLowerCase());
        }
        if (request.getStatus() != null) {
            branch.setStatus(request.getStatus());
        }
        if (request.getOpeningTime() != null) {
            branch.setOpeningTime(request.getOpeningTime());
        }
        if (request.getClosingTime() != null) {
            branch.setClosingTime(request.getClosingTime());
        }
        if (request.getTakeawayEnabled() != null) {
            branch.setTakeawayEnabled(request.getTakeawayEnabled());
        }
        if (request.getCodEnabled() != null) {
            branch.setCodEnabled(request.getCodEnabled());
        }

        Branch saved = branchRepository.save(branch);
        return BranchDto.fromEntity(saved);
    }

    /** Branch manager edit: only contact details, trading hours and ordering flags. */
    @Transactional
    public BranchDto updateBranchAsManager(Long id, ManagerBranchUpdateDto request) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
        if (request.phone() != null && !request.phone().isBlank()) {
            branch.setPhone(request.phone().trim());
        }
        if (request.email() != null && !request.email().isBlank()) {
            branch.setEmail(request.email().trim().toLowerCase());
        }
        if (request.openingTime() != null) {
            branch.setOpeningTime(request.openingTime());
        }
        if (request.closingTime() != null) {
            branch.setClosingTime(request.closingTime());
        }
        if (request.takeawayEnabled() != null) {
            branch.setTakeawayEnabled(request.takeawayEnabled());
        }
        if (request.codEnabled() != null) {
            branch.setCodEnabled(request.codEnabled());
        }
        return BranchDto.fromEntity(branchRepository.save(branch));
    }

    @Transactional(readOnly = true)
    public List<PublicBranchDto> getPublicBranches() {
        return branchRepository.findByStatus(BranchStatus.ACTIVE).stream()
                .sorted(Comparator.comparing(Branch::getName, String.CASE_INSENSITIVE_ORDER))
                .map(PublicBranchDto::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicBranchDto getPublicBranch(Long id) {
        return branchRepository.findById(id)
                .map(PublicBranchDto::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
    }

    @Transactional
    public BranchDto deactivateBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
        branch.setStatus(BranchStatus.INACTIVE);
        Branch saved = branchRepository.save(branch);
        return BranchDto.fromEntity(saved);
    }

    @Transactional
    public BranchDto activateBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));
        branch.setStatus(BranchStatus.ACTIVE);
        Branch saved = branchRepository.save(branch);
        return BranchDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getAllBranches(BranchStatus status) {
        List<Branch> list = status != null ? branchRepository.findByStatus(status) : branchRepository.findAll();
        return list.stream().map(BranchDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getActiveBranches() {
        return branchRepository.findByStatus(BranchStatus.ACTIVE)
                .stream()
                .map(BranchDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getInactiveBranches() {
        return branchRepository.findByStatus(BranchStatus.INACTIVE)
                .stream()
                .map(BranchDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBranch(Long id) {
        Branch branch = branchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + id));

        List<String> dependents = new ArrayList<>();
        long menuItems = menuItemRepository.countByBranchId(id);
        long sales = branchSaleRepository.countByBranchId(id);
        long orders = orderRepository.countByBranchId(id);
        long staff = userRepository.countByBranchId(id);
        if (menuItems > 0) dependents.add(menuItems + " menu item(s)");
        if (orders > 0) dependents.add(orders + " order(s)");
        if (sales > 0) dependents.add(sales + " sale record(s)");
        if (staff > 0) dependents.add(staff + " staff account(s)");
        if (!dependents.isEmpty()) {
            throw new BranchInUseException("Branch '" + branch.getName() + "' still has "
                    + String.join(", ", dependents) + ". Deactivate it instead of deleting.");
        }
        branchRepository.delete(branch);
    }

    @Transactional
    public BranchSaleDto recordSale(Long branchId, RecordSaleRequestDto request) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + branchId));

        String orderNo = request.getOrderNumber();
        if (orderNo == null || orderNo.isBlank()) {
            orderNo = "ORD-" + branch.getBranchCode() + "-" + System.currentTimeMillis();
        }

        LocalDateTime saleDate = request.getSaleDate() != null ? request.getSaleDate() : LocalDateTime.now();
        String paymentMethod = request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()
                ? request.getPaymentMethod().toUpperCase()
                : "CARD";
        String status = request.getStatus() != null && !request.getStatus().isBlank()
                ? request.getStatus().toUpperCase()
                : "COMPLETED";
        Integer items = request.getItemsCount() != null && request.getItemsCount() > 0
                ? request.getItemsCount()
                : 1;

        BranchSale sale = new BranchSale(branch, orderNo, request.getTotalAmount(), saleDate, paymentMethod, status, items);
        BranchSale saved = branchSaleRepository.save(sale);
        return BranchSaleDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public MonthlyBranchSalesReportDto generateBranchMonthlySalesReport(Long branchId, int year, int month) {
        validateYearAndMonth(year, month);

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with id: " + branchId));

        LocalDateTime start = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime end = start.plusMonths(1);

        List<BranchSale> sales = branchSaleRepository.findByBranchIdAndSaleDateBetweenAndStatus(
                branchId, start, end, "COMPLETED"
        );

        MonthlyBranchSalesReportDto report = new MonthlyBranchSalesReportDto();
        report.setBranchId(branch.getId());
        report.setBranchName(branch.getName());
        report.setBranchCode(branch.getBranchCode());
        report.setCity(branch.getCity());
        report.setStatus(branch.getStatus());
        report.setYear(year);
        report.setMonth(month);
        report.setMonthName(Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + year);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal highestSale = BigDecimal.ZERO;
        Map<String, BigDecimal> paymentMap = new HashMap<>();
        Map<LocalDate, DailySalesDto> dailyMap = new HashMap<>();

        for (BranchSale sale : sales) {
            BigDecimal amt = sale.getTotalAmount() != null ? sale.getTotalAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(amt);
            if (amt.compareTo(highestSale) > 0) {
                highestSale = amt;
            }

            // Payment method aggregation
            String pm = sale.getPaymentMethod() != null ? sale.getPaymentMethod() : "OTHER";
            paymentMap.put(pm, paymentMap.getOrDefault(pm, BigDecimal.ZERO).add(amt));

            // Daily aggregation
            LocalDate date = sale.getSaleDate().toLocalDate();
            DailySalesDto daily = dailyMap.computeIfAbsent(date, d -> new DailySalesDto(d, BigDecimal.ZERO, 0));
            daily.setRevenue(daily.getRevenue().add(amt));
            daily.setOrderCount(daily.getOrderCount() + 1);
        }

        long totalOrders = sales.size();
        BigDecimal avgOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<DailySalesDto> dailyBreakdown = dailyMap.values().stream()
                .sorted(Comparator.comparing(DailySalesDto::getDate))
                .collect(Collectors.toList());

        report.setTotalRevenue(totalRevenue.setScale(2, RoundingMode.HALF_UP));
        report.setTotalOrders(totalOrders);
        report.setAverageOrderValue(avgOrderValue);
        report.setHighestSingleSale(highestSale.setScale(2, RoundingMode.HALF_UP));
        report.setRevenueByPaymentMethod(paymentMap);
        report.setDailyBreakdown(dailyBreakdown);

        return report;
    }

    @Transactional(readOnly = true)
    public FranchiseMonthlySalesReportDto generateFranchiseMonthlySalesReport(int year, int month) {
        validateYearAndMonth(year, month);

        LocalDateTime start = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime end = start.plusMonths(1);

        List<Branch> allBranches = branchRepository.findAll();
        List<BranchSale> allSales = branchSaleRepository.findBySaleDateBetweenAndStatus(start, end, "COMPLETED");

        FranchiseMonthlySalesReportDto report = new FranchiseMonthlySalesReportDto();
        report.setYear(year);
        report.setMonth(month);
        report.setMonthName(Month.of(month).getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + year);
        report.setTotalBranches(allBranches.size());

        int activeCount = 0;
        int inactiveCount = 0;
        for (Branch b : allBranches) {
            if (b.getStatus() == BranchStatus.ACTIVE) {
                activeCount++;
            } else {
                inactiveCount++;
            }
        }
        report.setActiveBranches(activeCount);
        report.setInactiveBranches(inactiveCount);

        // Group sales by branch ID
        Map<Long, List<BranchSale>> salesByBranch = allSales.stream()
                .collect(Collectors.groupingBy(s -> s.getBranch().getId()));

        BigDecimal totalFranchiseRevenue = BigDecimal.ZERO;
        long totalFranchiseOrders = allSales.size();

        for (BranchSale s : allSales) {
            if (s.getTotalAmount() != null) {
                totalFranchiseRevenue = totalFranchiseRevenue.add(s.getTotalAmount());
            }
        }

        report.setTotalFranchiseRevenue(totalFranchiseRevenue.setScale(2, RoundingMode.HALF_UP));
        report.setTotalFranchiseOrders(totalFranchiseOrders);
        report.setFranchiseAverageOrderValue(totalFranchiseOrders > 0
                ? totalFranchiseRevenue.divide(BigDecimal.valueOf(totalFranchiseOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO);

        String topBranchName = "N/A";
        BigDecimal topBranchRevenue = BigDecimal.ZERO;

        List<BranchSalesSummaryDto> branchSummaries = new ArrayList<>();

        for (Branch b : allBranches) {
            List<BranchSale> branchSales = salesByBranch.getOrDefault(b.getId(), Collections.emptyList());
            BigDecimal branchRevenue = BigDecimal.ZERO;
            for (BranchSale s : branchSales) {
                if (s.getTotalAmount() != null) {
                    branchRevenue = branchRevenue.add(s.getTotalAmount());
                }
            }

            long ordersCount = branchSales.size();
            BigDecimal branchAvg = ordersCount > 0
                    ? branchRevenue.divide(BigDecimal.valueOf(ordersCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            double percentage = 0.0;
            if (totalFranchiseRevenue.compareTo(BigDecimal.ZERO) > 0) {
                percentage = branchRevenue
                        .multiply(BigDecimal.valueOf(100))
                        .divide(totalFranchiseRevenue, 2, RoundingMode.HALF_UP)
                        .doubleValue();
            }

            if (branchRevenue.compareTo(topBranchRevenue) > 0) {
                topBranchRevenue = branchRevenue;
                topBranchName = b.getName();
            }

            branchSummaries.add(new BranchSalesSummaryDto(
                    b.getId(),
                    b.getName(),
                    b.getBranchCode(),
                    b.getCity(),
                    b.getStatus(),
                    branchRevenue.setScale(2, RoundingMode.HALF_UP),
                    ordersCount,
                    branchAvg,
                    percentage
            ));
        }

        // Sort branch summaries by total revenue descending
        branchSummaries.sort((s1, s2) -> s2.getTotalRevenue().compareTo(s1.getTotalRevenue()));

        report.setTopPerformingBranchName(topBranchName);
        report.setTopPerformingBranchRevenue(topBranchRevenue.setScale(2, RoundingMode.HALF_UP));
        report.setBranchSummaries(branchSummaries);

        return report;
    }

    private void validateYearAndMonth(int year, int month) {
        if (year < 2000 || year > 2100) {
            throw new IllegalArgumentException("Year must be between 2000 and 2100");
        }
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12");
        }
    }
}