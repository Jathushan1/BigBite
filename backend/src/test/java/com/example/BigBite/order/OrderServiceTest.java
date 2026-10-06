package com.example.BigBite.order;

import com.example.BigBite.order.dto.BillDto;
import com.example.BigBite.order.dto.ClaimOrdersResponseDto;
import com.example.BigBite.order.dto.OrderItemRequestDto;
import com.example.BigBite.order.dto.OrderRequestDto;
import com.example.BigBite.order.dto.OrderResponseDto;
import com.example.BigBite.order.dto.PaymentRequestDto;
import com.example.BigBite.order.external.BranchLookupService;
import com.example.BigBite.order.external.ComplaintService;
import com.example.BigBite.order.external.DeliveryService;
import com.example.BigBite.order.external.InventoryService;
import com.example.BigBite.order.external.MenuLookupService;
import com.example.BigBite.order.external.PromotionService;
import com.example.BigBite.order.external.ReviewService;
import com.example.BigBite.order.external.PaymentGateway;
import com.example.BigBite.order.external.RefundGateway;
import com.example.BigBite.auth.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
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
    private PromotionService promotionService;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private DeliveryService deliveryService;

    @Mock
    private ReviewService reviewService;

    @Mock
    private ComplaintService complaintService;

    private static final PaymentRequestDto.CardDto APPROVED_CARD =
            new PaymentRequestDto.CardDto("Test Customer", "4242 4242 4242 4242", 12, 2035, "123");
    private static final PaymentRequestDto.CardDto DECLINED_CARD =
            new PaymentRequestDto.CardDto("Test Customer", "4000000000000002", 12, 2035, "123");

    private static PaymentRequestDto card(PaymentMethod method, PaymentRequestDto.CardDto card) {
        return new PaymentRequestDto(method, card);
    }

    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Mock
    private OrderAccessGuard accessGuard;

    @Mock
    private SavedAddressRepository savedAddressRepository;

    @Mock
    private GuestTokenService guestTokenService;

    @Mock
    private OrderStatusHistoryRepository historyRepository;

    @Mock
    private PaymentAttemptRepository paymentAttemptRepository;

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private RefundGateway refundGateway;

    @Mock
    private CodEligibilityService codEligibilityService;

    @Mock
    private OrderTransitionGuard transitionGuard;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    @DisplayName("Customers must request cancellation once preparing; later statuses are locked")
    void testCancellationRejectedWhenPreparingOrLater() {
        // Test for PREPARING
        Order orderPreparing = new Order();
        orderPreparing.setId(1L);
        orderPreparing.setStatus(OrderStatus.PREPARING);

        when(orderRepository.findById(1L)).thenReturn(Optional.of(orderPreparing));

        OrderApiException ex1 = assertThrows(OrderApiException.class, () -> orderService.cancelOrder(1L, null, null));
        assertEquals("CANCEL_REQUEST_REQUIRED", ex1.getCode());

        // Test for OUT_FOR_DELIVERY
        Order orderDelivery = new Order();
        orderDelivery.setId(2L);
        orderDelivery.setStatus(OrderStatus.OUT_FOR_DELIVERY);

        when(orderRepository.findById(2L)).thenReturn(Optional.of(orderDelivery));

        OrderApiException ex2 = assertThrows(OrderApiException.class, () -> orderService.cancelOrder(2L, null, null));
        assertTrue(ex2.getMessage().contains("Order can no longer be cancelled"));

        // Test for READY_FOR_PICKUP
        Order orderPickup = new Order();
        orderPickup.setId(3L);
        orderPickup.setStatus(OrderStatus.READY_FOR_PICKUP);

        when(orderRepository.findById(3L)).thenReturn(Optional.of(orderPickup));

        OrderApiException ex3 = assertThrows(OrderApiException.class, () -> orderService.cancelOrder(3L, null, null));
        assertTrue(ex3.getMessage().contains("Order can no longer be cancelled"));
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
    @DisplayName("Promo code WELCOME10 discounts 10%, invalid code is rejected")
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
        lenient().when(inventoryService.canReserve(any(), any())).thenReturn(true);

        when(promotionService.calculateDiscount(eq("WELCOME10"), any(BigDecimal.class)))
                .thenReturn(new BigDecimal("240.00"));

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

        // Invalid promo codes are rejected before an order is saved.
        request.setPromoCode("INVALID_CODE");
        when(promotionService.calculateDiscount(eq("INVALID_CODE"), any(BigDecimal.class)))
                .thenThrow(new IllegalArgumentException("Invalid promo code"));

        OrderApiException error = assertThrows(OrderApiException.class, () -> orderService.placeOrder(request));
        assertEquals("INVALID_PROMO", error.getCode());
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
        lenient().when(inventoryService.canReserve(any(), any())).thenReturn(true);

        when(menuLookupService.getItem(103L))
                .thenReturn(new MenuLookupService.MenuItemInfo(103L, "Garlic Bread", new BigDecimal("450"), 1L));
        when(menuLookupService.isAvailable(103L)).thenReturn(true);
        lenient().when(inventoryService.canReserve(any(), any())).thenReturn(true);

        // 10% of 2850 = 285.00
        when(promotionService.calculateDiscount(eq("WELCOME10"), eq(new BigDecimal("2850.00"))))
                .thenReturn(new BigDecimal("285.00"));

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
    @DisplayName("Payment endpoint records payment and transitions status to PAYMENT_VERIFIED")
    void testRecordPaymentSuccess() {
        Order order = new Order();
        order.setId(15L);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findByIdForUpdate(15L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentGateway.charge(any(BigDecimal.class), any(PaymentGateway.CardDetails.class), anyString()))
                .thenReturn(PaymentGateway.GatewayResult.approved("MOCK-CARD-15", "VISA", "4242"))
                .thenReturn(PaymentGateway.GatewayResult.declined("CARD_DECLINED", "Your card was declined", "VISA", "0002"));

        OrderResponseDto response = orderService.recordPayment(15L, card(PaymentMethod.CREDIT_CARD, APPROVED_CARD));

        assertEquals(PaymentStatus.VERIFIED, response.getPaymentStatus());
        assertEquals(OrderStatus.PAYMENT_VERIFIED, response.getStatus());
        assertTrue(response.isAwaitingAcceptance());
        assertEquals("4242", response.getCardLast4());

        // Test payment failure
        Order order2 = new Order();
        order2.setId(16L);
        order2.setStatus(OrderStatus.PLACED);
        order2.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findByIdForUpdate(16L)).thenReturn(Optional.of(order2));
        OrderResponseDto failResponse = orderService.recordPayment(16L, card(PaymentMethod.CREDIT_CARD, DECLINED_CARD));
        assertEquals(PaymentStatus.FAILED, failResponse.getPaymentStatus());
        assertEquals(OrderStatus.PLACED, failResponse.getStatus());
    }

    @Test
    @DisplayName("Cash on delivery keeps the order PLACED until branch staff accept it")
    void testCodPaymentLimit() {
        // Order under 3000
        Order orderUnder = new Order();
        orderUnder.setId(20L);
        orderUnder.setStatus(OrderStatus.PLACED);
        orderUnder.setGrandTotal(new BigDecimal("2500.00"));
        orderUnder.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findByIdForUpdate(20L)).thenReturn(Optional.of(orderUnder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentRequestDto codReq = PaymentRequestDto.cod();
        OrderResponseDto response = orderService.recordPayment(20L, codReq);

        assertEquals(OrderStatus.PLACED, response.getStatus());
        assertTrue(response.isAwaitingAcceptance());
        assertEquals(PaymentStatus.PENDING, response.getPaymentStatus());
        assertEquals(PaymentMethod.CASH_ON_DELIVERY, response.getPaymentMethod());

        verify(codEligibilityService).requireEligible(orderUnder);
    }

    @Test
    @DisplayName("Sri Lankan phone validation rejects invalid format and accepts valid local and international formats")
    void testSriLankanPhoneValidation() {
        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);
        when(branchLookupService.supportsTakeaway(1L)).thenReturn(true);

        // Invalid format 1: too short
        OrderRequestDto req1 = new OrderRequestDto();
        req1.setBranchId(1L);
        req1.setFulfillmentType(FulfillmentType.TAKEAWAY);
        req1.setContactName("Kasun Perera");
        req1.setContactPhone("077123");
        req1.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        IllegalArgumentException ex1 = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(req1));
        assertTrue(ex1.getMessage().contains("Invalid Sri Lankan phone number format"));

        // Invalid format 2: double leading zero after country code +94077...
        OrderRequestDto req2 = new OrderRequestDto();
        req2.setBranchId(1L);
        req2.setFulfillmentType(FulfillmentType.TAKEAWAY);
        req2.setContactName("Kasun Perera");
        req2.setContactPhone("+940771234567");
        req2.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        IllegalArgumentException ex2 = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(req2));
        assertTrue(ex2.getMessage().contains("Invalid Sri Lankan phone number format"));

        // Valid format 1: 0771234567
        OrderRequestDto req3 = new OrderRequestDto();
        req3.setBranchId(1L);
        req3.setFulfillmentType(FulfillmentType.TAKEAWAY);
        req3.setContactName("Kasun Perera");
        req3.setContactPhone("0771234567");
        req3.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        when(menuLookupService.getItem(101L))
                .thenReturn(new MenuLookupService.MenuItemInfo(101L, "Margherita Pizza", new BigDecimal("1200"), 1L));
        when(menuLookupService.isAvailable(101L)).thenReturn(true);
        lenient().when(inventoryService.canReserve(any(), any())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto res3 = orderService.placeOrder(req3);
        assertNotNull(res3);
        assertEquals("0771234567", res3.getContactPhone());

        // Valid format 2: +94771234567
        req3.setContactPhone("+94771234567");
        OrderResponseDto res4 = orderService.placeOrder(req3);
        assertNotNull(res4);
        assertEquals("+94771234567", res4.getContactPhone());
    }

    @Test
    @DisplayName("Address is persisted to SavedAddress when saveAddress is true")
    void testSaveAddressOnOrderPlacement() {
        OrderRequestDto request = new OrderRequestDto();
        request.setCustomerId(99L);
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.DELIVERY);
        request.setDeliveryAddress("123 Duplication Road, Colombo 04");
        request.setCity("Colombo");
        request.setSaveAddress(true);
        request.setContactName("Nimal Silva");
        request.setContactPhone("0712345678");
        request.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);
        when(menuLookupService.getItem(101L))
                .thenReturn(new MenuLookupService.MenuItemInfo(101L, "Margherita Pizza", new BigDecimal("1200"), 1L));
        when(menuLookupService.isAvailable(101L)).thenReturn(true);
        lenient().when(inventoryService.canReserve(any(), any())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(savedAddressRepository.existsByCustomerIdAndAddressLine(99L, "123 Duplication Road, Colombo 04")).thenReturn(false);

        orderService.placeOrder(request);

        verify(savedAddressRepository, times(1)).save(any(SavedAddress.class));
    }

    @Test
    @DisplayName("Duplicate idempotency key returns existing order without creating a new one")
    void testPlaceOrder_DuplicateIdempotencyKey_ReturnsExistingOrder() {
        String key = "test-uuid-12345";
        OrderRequestDto request = new OrderRequestDto();
        request.setIdempotencyKey(key);
        request.setCustomerId(99L);
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.TAKEAWAY);
        request.setContactName("Nimal Silva");
        request.setContactPhone("0712345678");
        request.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        Order existingOrder = new Order();
        existingOrder.setId(555L);
        existingOrder.setCustomerId(99L);
        existingOrder.setIdempotencyKey(key);
        existingOrder.setBranchId(1L);
        existingOrder.setFulfillmentType(FulfillmentType.TAKEAWAY);
        existingOrder.setStatus(OrderStatus.PLACED);
        existingOrder.setSubtotal(new BigDecimal("1200.00"));
        existingOrder.setGrandTotal(new BigDecimal("1260.00"));

        when(orderRepository.findByIdempotencyKey(key)).thenReturn(Optional.of(existingOrder));

        OrderResponseDto response = orderService.placeOrder(request);

        assertNotNull(response);
        assertEquals(555L, response.getId());
        assertEquals(key, response.getIdempotencyKey());
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Branch name and address are snapshotted on Order at placement time")
    void testPlaceOrder_BranchSnapshotsPopulated() {
        OrderRequestDto request = new OrderRequestDto();
        request.setCustomerId(99L);
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.TAKEAWAY);
        request.setContactName("Nimal Silva");
        request.setContactPhone("0712345678");
        request.setItems(List.of(new OrderItemRequestDto(101L, 1)));

        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);
        when(branchLookupService.supportsTakeaway(1L)).thenReturn(true);
        when(branchLookupService.getBranchName(1L)).thenReturn("Colombo Branch");
        when(branchLookupService.getBranchAddress(1L)).thenReturn("42 Galle Road, Colombo 03");

        when(menuLookupService.getItem(101L))
                .thenReturn(new MenuLookupService.MenuItemInfo(101L, "Margherita Pizza", new BigDecimal("1200"), 1L));
        when(menuLookupService.isAvailable(101L)).thenReturn(true);
        lenient().when(inventoryService.canReserve(any(), any())).thenReturn(true);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponseDto response = orderService.placeOrder(request);

        assertNotNull(response);
        assertEquals("Colombo Branch", response.getBranchNameSnapshot());
        assertEquals("42 Galle Road, Colombo 03", response.getBranchAddressSnapshot());
    }

    @Test
    @DisplayName("Update order item quantity recalculates subtotal, tax and grand total")
    void testUpdateOrderItem_ChangeQuantity_RecalculatesTotals() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);
        order.setDeliveryFee(new BigDecimal("250.00"));
        order.setDiscountAmount(BigDecimal.ZERO);

        OrderItem item1 = new OrderItem(101L, "Margherita Pizza", new BigDecimal("1200.00"), 1, new BigDecimal("1200.00"));
        item1.setId(1L);
        item1.setOrder(order);

        OrderItem item2 = new OrderItem(102L, "Garlic Bread", new BigDecimal("500.00"), 2, new BigDecimal("1000.00"));
        item2.setId(2L);
        item2.setOrder(order);

        order.getItems().add(item1);
        order.getItems().add(item2);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        // Change item1 qty from 1 to 2
        lenient().when(inventoryService.canReserve(any(), any())).thenReturn(true);
        OrderResponseDto response = orderService.updateOrderItem(10L, 1L, 2);

        assertNotNull(response);
        // item1: 2 * 1200 = 2400, item2: 2 * 500 = 1000 => subtotal = 3400
        assertEquals(new BigDecimal("3400.00"), response.getSubtotal());
        // Tax 5% of 3400 = 170.00
        assertEquals(new BigDecimal("170.00"), response.getTaxAmount());
        // Grand total = 3400 + 250 + 170 = 3820.00
        assertEquals(new BigDecimal("3820.00"), response.getGrandTotal());
    }

    @Test
    @DisplayName("Update order item quantity to 0 removes item and recalculates totals")
    void testUpdateOrderItem_RemoveItem_RecalculatesTotals() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);
        order.setDeliveryFee(BigDecimal.ZERO);
        order.setDiscountAmount(BigDecimal.ZERO);

        OrderItem item1 = new OrderItem(101L, "Margherita Pizza", new BigDecimal("1200.00"), 1, new BigDecimal("1200.00"));
        item1.setId(1L);
        item1.setOrder(order);

        OrderItem item2 = new OrderItem(102L, "Garlic Bread", new BigDecimal("500.00"), 1, new BigDecimal("500.00"));
        item2.setId(2L);
        item2.setOrder(order);

        order.getItems().add(item1);
        order.getItems().add(item2);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        // Remove item2 by setting qty to 0
        OrderResponseDto response = orderService.updateOrderItem(10L, 2L, 0);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals(1L, response.getItems().get(0).getId());
        assertEquals(new BigDecimal("1200.00"), response.getSubtotal());
        assertEquals(new BigDecimal("60.00"), response.getTaxAmount());
        assertEquals(new BigDecimal("1260.00"), response.getGrandTotal());
    }

    @Test
    @DisplayName("Update order item rejected once status is PREPARING or later")
    void testUpdateOrderItem_LockedWhenPreparing() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PREPARING);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        OrderApiException ex = assertThrows(OrderApiException.class,
                () -> orderService.updateOrderItem(10L, 1L, 2));
        assertTrue(ex.getMessage().contains("only be edited before payment"));
    }

    @Test
    @DisplayName("Cannot remove the only item in the order")
    void testUpdateOrderItem_CannotRemoveOnlyItem() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);

        OrderItem item1 = new OrderItem(101L, "Margherita Pizza", new BigDecimal("1200.00"), 1, new BigDecimal("1200.00"));
        item1.setId(1L);
        item1.setOrder(order);
        order.getItems().add(item1);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> orderService.updateOrderItem(10L, 1L, 0));
        assertTrue(ex.getMessage().contains("Cannot remove the only remaining item"));
    }

    @Test
    @DisplayName("Cancelling an order with paymentStatus VERIFIED sets refundStatus to PENDING")
    void testCancelOrder_VerifiedPayment_SetsRefundPending() {
        Order order = new Order();
        order.setId(20L);
        order.setStatus(OrderStatus.PAYMENT_VERIFIED);
        order.setPaymentStatus(PaymentStatus.VERIFIED);
        order.setRefundStatus(RefundStatus.NOT_APPLICABLE);

        when(orderRepository.findById(20L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(refundGateway.refund(any(), any())).thenReturn(new RefundGateway.RefundResult(true, "MOCK-REFUND"));

        OrderResponseDto response = orderService.cancelOrder(20L, null, null);

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        assertEquals(RefundStatus.PROCESSED, response.getRefundStatus());
        assertEquals(PaymentStatus.REFUNDED, response.getPaymentStatus());
        verify(eventPublisher).publishEvent(any(com.example.BigBite.order.event.OrderEvents.Cancelled.class));
    }

    @Test
    @DisplayName("Cancelling an unverified order leaves refundStatus as NOT_APPLICABLE")
    void testCancelOrder_PendingPayment_RefundNotApplicable() {
        Order order = new Order();
        order.setId(21L);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setRefundStatus(RefundStatus.NOT_APPLICABLE);

        when(orderRepository.findById(21L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponseDto response = orderService.cancelOrder(21L, null, null);

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, response.getStatus());
        assertEquals(RefundStatus.NOT_APPLICABLE, response.getRefundStatus());
    }

    @Test
    @DisplayName("OrderResponseDto maps version correctly from Order entity")
    void testOrderResponseDto_IncludesVersion() {
        Order order = new Order();
        order.setId(77L);
        order.setVersion(3L);
        order.setStatus(OrderStatus.PLACED);

        when(orderRepository.findById(77L)).thenReturn(Optional.of(order));

        OrderResponseDto dto = orderService.getOrderById(77L);

        assertNotNull(dto);
        assertEquals(3L, dto.getVersion());
    }

    @Test
    @DisplayName("autoCancelAbandonedOrders transitions expired PLACED orders to CANCELLED with TIMEOUT reason")
    void testAutoCancelAbandonedOrders_CancelsWithTimeoutReason() {
        Order abandoned1 = new Order();
        abandoned1.setId(501L);
        abandoned1.setStatus(OrderStatus.PLACED);
        abandoned1.setPaymentStatus(PaymentStatus.PENDING);

        Order abandoned2 = new Order();
        abandoned2.setId(502L);
        abandoned2.setStatus(OrderStatus.PLACED);
        abandoned2.setPaymentStatus(PaymentStatus.PENDING);

        when(orderRepository.findAbandonedCardOrders(
                eq(OrderStatus.PLACED),
                eq(List.of(PaymentStatus.PENDING, PaymentStatus.FAILED)),
                eq(PaymentMethod.CASH_ON_DELIVERY),
                any(LocalDateTime.class)
        )).thenReturn(List.of(abandoned1, abandoned2));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        int cancelledCount = orderService.autoCancelAbandonedOrders(15);

        assertEquals(2, cancelledCount);
        assertEquals(OrderStatus.CANCELLED, abandoned1.getStatus());
        assertEquals("TIMEOUT", abandoned1.getCancellationReason());
        assertEquals(OrderStatus.CANCELLED, abandoned2.getStatus());
        assertEquals("TIMEOUT", abandoned2.getCancellationReason());
        verify(orderRepository, times(2)).save(any(Order.class));
    }

    @Test
    @DisplayName("autoCancelAbandonedOrders with no matches does not save anything")
    void testAutoCancelAbandonedOrders_NoMatches() {
        when(orderRepository.findAbandonedCardOrders(
                eq(OrderStatus.PLACED),
                eq(List.of(PaymentStatus.PENDING, PaymentStatus.FAILED)),
                eq(PaymentMethod.CASH_ON_DELIVERY),
                any(LocalDateTime.class)
        )).thenReturn(List.of());

        int cancelledCount = orderService.autoCancelAbandonedOrders(15);

        assertEquals(0, cancelledCount);
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("Place order fails when subtotal is below minimum order value of LKR 500")
    void testPlaceOrder_SubtotalBelowMinimum_ThrowsException() {
        OrderRequestDto request = new OrderRequestDto();
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.TAKEAWAY);
        request.setContactName("Kasun Perera");
        request.setContactPhone("0771234567");
        request.setItems(List.of(new OrderItemRequestDto(201L, 1))); // price 300 < 500

        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);
        when(branchLookupService.supportsTakeaway(1L)).thenReturn(true);

        when(menuLookupService.getItem(201L))
                .thenReturn(new MenuLookupService.MenuItemInfo(201L, "Soft Drink", new BigDecimal("300.00"), 1L));
        when(menuLookupService.isAvailable(201L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(request));
        assertTrue(ex.getMessage().contains("Minimum order subtotal is LKR 500.00"));
    }

    @Test
    @DisplayName("Place order fails when distinct items exceed limit of 20")
    void testPlaceOrder_ExceedsMaxDistinctItems_ThrowsException() {
        OrderRequestDto request = new OrderRequestDto();
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.TAKEAWAY);
        request.setContactName("Kasun Perera");
        request.setContactPhone("0771234567");

        List<OrderItemRequestDto> items = new java.util.ArrayList<>();
        for (long i = 1; i <= 21; i++) {
            items.add(new OrderItemRequestDto(i, 1));
        }
        request.setItems(items);

        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);
        when(branchLookupService.supportsTakeaway(1L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(request));
        assertTrue(ex.getMessage().contains("Order cannot contain more than 20 distinct items"));
    }

    @Test
    @DisplayName("Place order fails when single item quantity exceeds 50")
    void testPlaceOrder_ItemQuantityExceedsMax_ThrowsException() {
        OrderRequestDto request = new OrderRequestDto();
        request.setBranchId(1L);
        request.setFulfillmentType(FulfillmentType.TAKEAWAY);
        request.setContactName("Kasun Perera");
        request.setContactPhone("0771234567");
        request.setItems(List.of(new OrderItemRequestDto(101L, 51)));

        when(branchLookupService.branchExists(1L)).thenReturn(true);
        when(branchLookupService.isBranchOpen(1L)).thenReturn(true);
        when(branchLookupService.supportsTakeaway(1L)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> orderService.placeOrder(request));
        assertTrue(ex.getMessage().contains("cannot exceed 50"));
    }

    @Test
    @DisplayName("Update order item fails when quantity exceeds 50")
    void testUpdateOrderItem_ExceedsMaxQuantity_ThrowsException() {
        Order order = new Order();
        order.setId(10L);
        order.setStatus(OrderStatus.PLACED);

        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> orderService.updateOrderItem(10L, 1L, 51));
        assertTrue(ex.getMessage().contains("Quantity cannot exceed maximum limit of 50"));
    }

    @Test
    @DisplayName("Repeating a payment key returns its original result without another charge")
    void paymentKeyReturnsOriginalSnapshot() {
        Order order = new Order();
        order.setId(90L);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setGrandTotal(new BigDecimal("1260.00"));
        when(orderRepository.findByIdForUpdate(90L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(paymentGateway.charge(eq(new BigDecimal("1260.00")), any(PaymentGateway.CardDetails.class), eq("payment-key")))
                .thenReturn(PaymentGateway.GatewayResult.approved("MOCK-90", "VISA", "4242"));
        java.util.concurrent.atomic.AtomicReference<PaymentAttempt> attempt = new java.util.concurrent.atomic.AtomicReference<>();
        when(paymentAttemptRepository.findByIdempotencyKey("payment-key"))
                .thenAnswer(i -> Optional.ofNullable(attempt.get()));
        when(paymentAttemptRepository.save(any(PaymentAttempt.class))).thenAnswer(i -> {
            attempt.set(i.getArgument(0));
            return i.getArgument(0);
        });

        PaymentRequestDto request = card(PaymentMethod.CREDIT_CARD, APPROVED_CARD);
        OrderService.PaymentResult first = orderService.recordPayment(90L, request, "payment-key");
        assertEquals(OrderStatus.PAYMENT_VERIFIED, first.order().getStatus());
        order.setStatus(OrderStatus.CONFIRMED);
        OrderService.PaymentResult retry = orderService.recordPayment(90L, request, "payment-key");
        assertEquals(OrderStatus.PAYMENT_VERIFIED, retry.order().getStatus());
        assertEquals("MOCK-90", retry.order().getPaymentReference());
        verify(paymentGateway, times(1)).charge(any(), any(), anyString());
    }

    @Test
    @DisplayName("Third declined card attempt voids and cancels the order")
    void thirdDeclineCancelsOrder() {
        Order order = new Order();
        order.setId(91L);
        order.setStatus(OrderStatus.PLACED);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setGrandTotal(new BigDecimal("1260.00"));
        when(orderRepository.findByIdForUpdate(91L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(paymentGateway.charge(any(), any(), anyString()))
                .thenReturn(PaymentGateway.GatewayResult.declined("CARD_DECLINED", "Your card was declined", "VISA", "0002"));
        PaymentRequestDto request = card(PaymentMethod.DEBIT_CARD, DECLINED_CARD);

        for (int attempt = 1; attempt <= 3; attempt++) {
            OrderService.PaymentResult result = orderService.recordPayment(91L, request, "decline-" + attempt);
            assertEquals(402, result.httpStatus());
        }
        assertEquals(3, order.getPaymentAttempts());
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(PaymentStatus.VOIDED, order.getPaymentStatus());
        assertEquals("PAYMENT_FAILED", order.getCancellationReason());
    }

    @Test
    @DisplayName("COD collection records exact cash and change before delivery")
    void cashCollectionCompletesHandover() {
        Order order = new Order();
        order.setId(92L);
        order.setBranchId(1L);
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        order.setFulfillmentType(FulfillmentType.DELIVERY);
        order.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setGrandTotal(new BigDecimal("3007.50"));
        when(orderRepository.findById(92L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        com.example.BigBite.auth.User rider = new com.example.BigBite.auth.User();
        rider.setId(7L);
        rider.setRole(com.example.BigBite.auth.Role.DELIVERY_PARTNER);

        OrderResponseDto result = orderService.collectCod(92L, new BigDecimal("3500.00"), rider);
        assertEquals(OrderStatus.DELIVERED, result.getStatus());
        assertEquals(PaymentStatus.VERIFIED, result.getPaymentStatus());
        assertEquals(new BigDecimal("492.50"), result.getChangeGiven());
        verify(historyRepository).save(any(OrderStatusHistory.class));
    }

    @Test
    @DisplayName("Failed COD delivery records a strike while card remains paid")
    void deliveryFailureTracksCodButDoesNotRefundCard() {
        Order cod = new Order();
        cod.setId(93L);
        cod.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        cod.setPaymentMethod(PaymentMethod.CASH_ON_DELIVERY);
        cod.setPaymentStatus(PaymentStatus.PENDING);
        Order card = new Order();
        card.setId(94L);
        card.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        card.setPaymentMethod(PaymentMethod.CREDIT_CARD);
        card.setPaymentStatus(PaymentStatus.VERIFIED);
        when(orderRepository.findById(93L)).thenReturn(Optional.of(cod));
        when(orderRepository.findById(94L)).thenReturn(Optional.of(card));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        com.example.BigBite.auth.User rider = new com.example.BigBite.auth.User();
        rider.setId(7L);
        rider.setRole(com.example.BigBite.auth.Role.DELIVERY_PARTNER);

        orderService.markDeliveryFailed(93L, "CUSTOMER_UNREACHABLE", rider);
        orderService.markDeliveryFailed(94L, "REFUSED", rider);
        assertEquals(OrderStatus.DELIVERY_FAILED, cod.getStatus());
        assertEquals(PaymentStatus.FAILED, cod.getPaymentStatus());
        assertEquals(PaymentStatus.VERIFIED, card.getPaymentStatus());
        verify(eventPublisher, times(2)).publishEvent(any(com.example.BigBite.order.event.OrderEvents.DeliveryFailed.class));
    }
}
