package com.example.BigBite.order;

import com.example.BigBite.order.dto.BillDto;
import com.example.BigBite.order.dto.OrderItemRequestDto;
import com.example.BigBite.order.dto.OrderRequestDto;
import com.example.BigBite.order.dto.OrderResponseDto;
import com.example.BigBite.order.external.BranchLookupService;
import com.example.BigBite.order.external.InventoryCheckService;
import com.example.BigBite.order.external.MenuLookupService;
import com.example.BigBite.order.external.PromotionValidationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BranchLookupService branchLookupService;

    @Mock
    private MenuLookupService menuLookupService;

    @Mock
    private PromotionValidationService promotionValidationService;

    @Mock
    private InventoryCheckService inventoryCheckService;

    @InjectMocks
    private OrderService orderService;

    @Test
    @DisplayName("Cancellation rejected once status is PREPARING or later")
    void testCancellationRejectedWhenPreparingOrLater() {
        // Test for PREPARING
        Order orderPreparing = new Order();
        orderPreparing.setId(1L);
        orderPreparing.setStatus(OrderStatus.PREPARING);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(orderPreparing));

        IllegalStateException ex1 = assertThrows(IllegalStateException.class, () -> orderService.cancelOrder(1L));
        assertTrue(ex1.getMessage().contains("Cannot cancel order once preparation has started"));

        // Test for OUT_FOR_DELIVERY
        Order orderDelivery = new Order();
        orderDelivery.setId(2L);
        orderDelivery.setStatus(OrderStatus.OUT_FOR_DELIVERY);

        when(orderRepository.findById(2L)).thenReturn(Optional.of(orderDelivery));

        IllegalStateException ex2 = assertThrows(IllegalStateException.class, () -> orderService.cancelOrder(2L));
        assertTrue(ex2.getMessage().contains("Cannot cancel order once preparation has started"));

        // Test for READY_FOR_PICKUP
        Order orderPickup = new Order();
        orderPickup.setId(3L);
        orderPickup.setStatus(OrderStatus.READY_FOR_PICKUP);

        when(orderRepository.findById(3L)).thenReturn(Optional.of(orderPickup));

        IllegalStateException ex3 = assertThrows(IllegalStateException.class, () -> orderService.cancelOrder(3L));
        assertTrue(ex3.getMessage().contains("Cannot cancel order once preparation has started"));
    }

    @Test
    @DisplayName("Order placement rejected when branch is closed")
    void testOrderPlacementRejectedWhenBranchClosed() {
        OrderRequestDto request = new OrderRequestDto();
        request.setBranchId(2L); // Jaffna - closed
        request.setFulfillmentType(FulfillmentType.DELIVERY);
        request.setDeliveryAddress("12 Main St, Jaffna");
        request.setGuestName("Alice");
        request.setGuestPhone("0771112222");
        request.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        when(branchLookupService.branchExists(2L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(2L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(request));
        assertTrue(ex.getMessage().contains("is currently closed") || ex.getMessage().contains("does not exist"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Order placement rejected when takeaway requested but branch does not support it")
    void testOrderPlacementRejectedWhenTakeawayNotSupported() {
        OrderRequestDto request = new OrderRequestDto();
        request.setBranchId(2L);
        request.setFulfillmentType(FulfillmentType.TAKEAWAY);
        request.setGuestName("Alice");
        request.setGuestPhone("0771112222");
        request.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        when(branchLookupService.branchExists(2L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(2L)).thenReturn(true);
        when(branchLookupService.supportsTakeaway(2L)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(request));
        assertTrue(ex.getMessage().contains("does not support takeaway"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Guest order rejected without guestName or guestPhone")
    void testGuestOrderRejectedWithoutNameOrPhone() {
        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);

        // Missing guestName
        OrderRequestDto req1 = new OrderRequestDto();
        req1.setCustomerId(null);
        req1.setBranchId(1L);
        req1.setFulfillmentType(FulfillmentType.TAKEAWAY);
        req1.setGuestName("");
        req1.setGuestPhone("0771112222");
        req1.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        when(branchLookupService.supportsTakeaway(1L)).thenReturn(true);

        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(req1));
        assertTrue(ex1.getMessage().contains("guestName is required"));

        // Missing guestPhone
        OrderRequestDto req2 = new OrderRequestDto();
        req2.setCustomerId(null);
        req2.setBranchId(1L);
        req2.setFulfillmentType(FulfillmentType.TAKEAWAY);
        req2.setGuestName("Bob");
        req2.setGuestPhone(null);
        req2.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(req2));
        assertTrue(ex2.getMessage().contains("guestPhone is required"));
    }

    @Test
    @DisplayName("Promo code WELCOME10 correctly discounts 10%, invalid code returns valid=false and does not change total")
    void testPromoCodeWelcome10AppliesTenPercent() {
        OrderRequestDto request = new OrderRequestDto();
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.TAKEAWAY);
        request.setCustomerId(10L);
        request.setPromoCode("WELCOME10");
        request.setItems(List.of(new OrderItemRequestDto(101L, 2))); // 1200 * 2 = 2400

        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);
        when(branchLookupService.supportsTakeaway(1L)).thenReturn(true);

        when(menuLookupService.getItem(101L))
                .thenReturn(new MenuLookupService.MenuItemInfo(101L, "Margherita Pizza", new BigDecimal("1200"), 1L));
        when(menuLookupService.isAvailable(101L)).thenReturn(true);
        when(inventoryCheckService.isInStock(101L, 2)).thenReturn(true);

        when(promotionValidationService.validate(eq("WELCOME10"), any(BigDecimal.class)))
                .thenReturn(new PromotionValidationService.DiscountResult(true, new BigDecimal("240.00"), "Applied 10%"));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(100L);
            return o;
        });

        OrderResponseDto response = orderService.placeOrder(request);

        assertNotNull(response);
        assertEquals(new BigDecimal("2400.00"), response.getSubtotal());
        assertEquals(new BigDecimal("240.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("0.00"), response.getDeliveryFee());
        // Tax 5% of 2400 = 120.00
        assertEquals(new BigDecimal("120.00"), response.getTaxAmount());
        // Grand total = 2400 + 0 + 120 - 240 = 2280.00
        assertEquals(new BigDecimal("2280.00"), response.getGrandTotal());
        assertEquals("WELCOME10", response.getPromoCode());

        // Test invalid promo code does not apply discount
        request.setPromoCode("INVALID_CODE");
        when(promotionValidationService.validate(eq("INVALID_CODE"), any(BigDecimal.class)))
                .thenReturn(new PromotionValidationService.DiscountResult(false, BigDecimal.ZERO, "Invalid promo code"));

        OrderResponseDto response2 = orderService.placeOrder(request);
        assertEquals(new BigDecimal("0.00"), response2.getDiscountAmount());
        // Grand total = 2400 + 0 + 120 - 0 = 2520.00
        assertEquals(new BigDecimal("2520.00"), response2.getGrandTotal());
    }

    @Test
    @DisplayName("Bill total math is correct given multiple items + delivery fee + tax + discount")
    void testBillTotalMathIsCorrect() {
        OrderRequestDto request = new OrderRequestDto();
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.DELIVERY);
        request.setDeliveryAddress("55 Galle Road, Colombo 3");
        request.setCustomerId(5L);
        request.setPromoCode("WELCOME10");
        request.setItems(List.of(
                new OrderItemRequestDto(101L, 2), // 1200 * 2 = 2400
                new OrderItemRequestDto(103L, 1)  // 450 * 1 = 450
        )); // subtotal = 2850

        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);

        when(menuLookupService.getItem(101L))
                .thenReturn(new MenuLookupService.MenuItemInfo(101L, "Margherita Pizza", new BigDecimal("1200"), 1L));
        when(menuLookupService.isAvailable(101L)).thenReturn(true);
        when(inventoryCheckService.isInStock(101L, 2)).thenReturn(true);

        when(menuLookupService.getItem(103L))
                .thenReturn(new MenuLookupService.MenuItemInfo(103L, "Garlic Bread", new BigDecimal("450"), 1L));
        when(menuLookupService.isAvailable(103L)).thenReturn(true);
        when(inventoryCheckService.isInStock(103L, 1)).thenReturn(true);

        // 10% of 2850 = 285.00
        when(promotionValidationService.validate(eq("WELCOME10"), eq(new BigDecimal("2850.00"))))
                .thenReturn(new PromotionValidationService.DiscountResult(true, new BigDecimal("285.00"), "Applied 10%"));

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setId(200L);
            return o;
        });

        OrderResponseDto orderResponse = orderService.placeOrder(request);

        // Verification of Order math
        assertEquals(new BigDecimal("2850.00"), orderResponse.getSubtotal());
        assertEquals(new BigDecimal("300.00"), orderResponse.getDeliveryFee()); // Delivery fee = 300
        assertEquals(new BigDecimal("142.50"), orderResponse.getTaxAmount());   // 5% of 2850 = 142.50
        assertEquals(new BigDecimal("285.00"), orderResponse.getDiscountAmount()); // 285.00 discount
        // GrandTotal = 2850 + 300 + 142.50 - 285.00 = 3007.50
        assertEquals(new BigDecimal("3007.50"), orderResponse.getGrandTotal());

        // Verification via BillDto
        Order persistedOrder = new Order();
        persistedOrder.setId(200L);
        persistedOrder.setCustomerId(5L);
        persistedOrder.setBranchId(1L);
        persistedOrder.setFulfillmentType(FulfillmentType.DELIVERY);
        persistedOrder.setDeliveryAddress("55 Galle Road, Colombo 3");
        persistedOrder.setSubtotal(orderResponse.getSubtotal());
        persistedOrder.setDeliveryFee(orderResponse.getDeliveryFee());
        persistedOrder.setTaxAmount(orderResponse.getTaxAmount());
        persistedOrder.setDiscountAmount(orderResponse.getDiscountAmount());
        persistedOrder.setGrandTotal(orderResponse.getGrandTotal());
        persistedOrder.setPromoCode("WELCOME10");
        persistedOrder.setStatus(OrderStatus.PLACED);
        persistedOrder.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findById(200L)).thenReturn(Optional.of(persistedOrder));

        BillDto bill = orderService.getOrderBill(200L);
        assertEquals(new BigDecimal("2850.00"), bill.getSubtotal());
        assertEquals(new BigDecimal("300.00"), bill.getDeliveryFee());
        assertEquals(new BigDecimal("142.50"), bill.getTaxAmount());
        assertEquals(new BigDecimal("285.00"), bill.getDiscountAmount());
        assertEquals(new BigDecimal("3007.50"), bill.getGrandTotal());
        assertEquals(new BigDecimal("5.00"), bill.getTaxRatePercent());
    }

    @Test
    @DisplayName("Status transition follows strict pipeline and rejects invalid leaps")
    void testStatusTransitionValidation() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);
        order.setFulfillmentType(FulfillmentType.DELIVERY);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        // PLACED -> PREPARING should fail (cannot skip PAYMENT_VERIFIED and CONFIRMED)
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                orderService.updateOrderStatus(10L, OrderStatus.PREPARING));
        assertTrue(ex.getMessage().contains("Invalid status transition"));

        // PLACED -> PAYMENT_VERIFIED should succeed
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        OrderResponseDto updated = orderService.updateOrderStatus(10L, OrderStatus.PAYMENT_VERIFIED);
        assertEquals(OrderStatus.PAYMENT_VERIFIED, updated.getStatus());
    }

    @Test
    @DisplayName("Payment endpoint records payment and transitions status to PAYMENT_VERIFIED")
    void testRecordPaymentSuccess() {
        Order order = new Order();
        order.setId(15L);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findById(15L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto response = orderService.recordPayment(15L, true);

        assertEquals(PaymentStatus.VERIFIED, response.getPaymentStatus());
        assertEquals(OrderStatus.PAYMENT_VERIFIED, response.getStatus());

        // Test payment failure
        Order order2 = new Order();
        order2.setId(16L);
        order2.setStatus(OrderStatus.PLACED);
        order2.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findById(16L)).thenReturn(Optional.of(order2));

        OrderResponseDto failResponse = orderService.recordPayment(16L, false);
        assertEquals(PaymentStatus.FAILED, failResponse.getPaymentStatus());
        assertEquals(OrderStatus.PLACED, failResponse.getStatus());
    }
}
