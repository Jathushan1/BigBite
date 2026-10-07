package com.example.BigBite.order.service;

import com.example.BigBite.order.entity.Order;
import com.example.BigBite.order.enums.OrderStatus;
import com.example.BigBite.order.enums.PaymentMethod;
import com.example.BigBite.order.exception.OrderApiException;
import com.example.BigBite.order.repository.OrderRepository;
import com.example.BigBite.order.external.BranchLookupService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CodEligibilityService {
    private final BranchLookupService branches;
    private final OrderRepository orders;
    private final boolean allowGuest;
    private final BigDecimal maxTotal;
    private final int strikeLimit;
    private final int maxOpenOrders;

    public CodEligibilityService(BranchLookupService branches, OrderRepository orders,
                                 @Value("${bigbite.cod.allow-guest:false}") boolean allowGuest,
                                 @Value("${bigbite.cod.max-order-total:10000.00}") BigDecimal maxTotal,
                                 @Value("${bigbite.cod.strike-limit:2}") int strikeLimit,
                                 @Value("${bigbite.cod.max-open-orders:2}") int maxOpenOrders) {
        this.branches = branches;
        this.orders = orders;
        this.allowGuest = allowGuest;
        this.maxTotal = maxTotal;
        this.strikeLimit = strikeLimit;
        this.maxOpenOrders = maxOpenOrders;
    }

    public record Eligibility(boolean eligible, String code, String message) {}

    public Eligibility evaluate(Order order) {
        if (!allowGuest && order.getCustomerId() == null) {
            return new Eligibility(false, "COD_LOGIN_REQUIRED", "Log in to pay with cash");
        }
        if (!branches.acceptsCod(order.getBranchId())) {
            return new Eligibility(false, "COD_DISABLED_AT_BRANCH", "This branch does not accept cash orders");
        }
        if (order.getGrandTotal().compareTo(maxTotal) > 0) {
            return new Eligibility(false, "COD_LIMIT_EXCEEDED", "Cash payment is available for orders up to Rs. " + maxTotal);
        }
        if (order.getCustomerId() != null) {
            long strikes = orders.countByCustomerIdAndPaymentMethodAndStatus(
                    order.getCustomerId(), PaymentMethod.CASH_ON_DELIVERY, OrderStatus.DELIVERY_FAILED);
            if (strikes >= strikeLimit) {
                return new Eligibility(false, "COD_BLOCKED_FOR_CUSTOMER", "Cash payment is unavailable after failed deliveries");
            }
            long openOrders = orders.countOpenCodOrders(order.getCustomerId(), PaymentMethod.CASH_ON_DELIVERY,
                    List.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.DELIVERY_FAILED));
            if (openOrders >= maxOpenOrders) {
                return new Eligibility(false, "TOO_MANY_OPEN_COD_ORDERS", "Complete an open cash order before placing another");
            }
        }
        return new Eligibility(true, null, null);
    }

    public void requireEligible(Order order) {
        Eligibility result = evaluate(order);
        if (!result.eligible()) {
            throw new OrderApiException(HttpStatus.UNPROCESSABLE_ENTITY, result.code(), result.message());
        }
    }
}
