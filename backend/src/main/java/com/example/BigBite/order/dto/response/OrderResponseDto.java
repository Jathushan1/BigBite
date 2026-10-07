package com.example.BigBite.order.dto.response;

import com.example.BigBite.order.enums.CancelRequestStatus;
import com.example.BigBite.order.enums.FulfillmentType;
import com.example.BigBite.order.enums.OrderStatus;
import com.example.BigBite.order.enums.PaymentMethod;
import com.example.BigBite.order.enums.PaymentStatus;
import com.example.BigBite.order.enums.RefundStatus;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponseDto {

    private Long id;
    private Long customerId;
    private String contactName;
    private String contactPhone;
    private String guestName;
    private String guestPhone;
    private String guestEmail;
    private Long branchId;
    private String branchNameSnapshot;
    private String branchAddressSnapshot;
    private FulfillmentType fulfillmentType;
    private String deliveryAddress;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal deliveryFee;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal grandTotal;
    private String promoCode;
    private PaymentStatus paymentStatus;
    private RefundStatus refundStatus;
    private PaymentMethod paymentMethod;
    private String idempotencyKey;
    private Long version;
    private String cancellationReason;
    private String failureReason;
    private String paymentReference;
    private int paymentAttempts;
    private BigDecimal cashCollected;
    private BigDecimal changeGiven;
    private BigDecimal refundedAmount;
    private Long riderId;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String guestToken;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponseDto> items;
    private String riderName;
    private String riderPhone;
    private boolean awaitingAcceptance;
    private LocalDateTime awaitingAcceptanceSince;
    private LocalDateTime acceptedAt;
    private CancelRequestStatus cancelRequestStatus;
    private String cancelRequestReason;
    private LocalDateTime cancelRequestedAt;
    private String cancelRequestNote;
    private String cardBrand;
    private String cardLast4;
    private int refundAttempts;

    public OrderResponseDto() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getContactName() {
        return contactName != null ? contactName : guestName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactPhone() {
        return contactPhone != null ? contactPhone : guestPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getGuestName() {
        return guestName;
    }

    public void setGuestName(String guestName) {
        this.guestName = guestName;
    }

    public String getGuestPhone() {
        return guestPhone;
    }

    public void setGuestPhone(String guestPhone) {
        this.guestPhone = guestPhone;
    }

    public String getGuestEmail() {
        return guestEmail;
    }

    public void setGuestEmail(String guestEmail) {
        this.guestEmail = guestEmail;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public FulfillmentType getFulfillmentType() {
        return fulfillmentType;
    }

    public void setFulfillmentType(FulfillmentType fulfillmentType) {
        this.fulfillmentType = fulfillmentType;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public BigDecimal getDeliveryFee() {
        return deliveryFee;
    }

    public void setDeliveryFee(BigDecimal deliveryFee) {
        this.deliveryFee = deliveryFee;
    }

    public BigDecimal getTaxAmount() {
        return taxAmount;
    }

    public void setTaxAmount(BigDecimal taxAmount) {
        this.taxAmount = taxAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getGrandTotal() {
        return grandTotal;
    }

    public void setGrandTotal(BigDecimal grandTotal) {
        this.grandTotal = grandTotal;
    }

    public String getPromoCode() {
        return promoCode;
    }

    public void setPromoCode(String promoCode) {
        this.promoCode = promoCode;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<OrderItemResponseDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponseDto> items) {
        this.items = items;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getBranchNameSnapshot() {
        return branchNameSnapshot;
    }

    public void setBranchNameSnapshot(String branchNameSnapshot) {
        this.branchNameSnapshot = branchNameSnapshot;
    }

    public String getBranchAddressSnapshot() {
        return branchAddressSnapshot;
    }

    public void setBranchAddressSnapshot(String branchAddressSnapshot) {
        this.branchAddressSnapshot = branchAddressSnapshot;
    }

    public RefundStatus getRefundStatus() {
        return refundStatus;
    }

    public void setRefundStatus(RefundStatus refundStatus) {
        this.refundStatus = refundStatus;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String paymentReference) { this.paymentReference = paymentReference; }
    public int getPaymentAttempts() { return paymentAttempts; }
    public void setPaymentAttempts(int paymentAttempts) { this.paymentAttempts = paymentAttempts; }
    public BigDecimal getCashCollected() { return cashCollected; }
    public void setCashCollected(BigDecimal cashCollected) { this.cashCollected = cashCollected; }
    public BigDecimal getChangeGiven() { return changeGiven; }
    public void setChangeGiven(BigDecimal changeGiven) { this.changeGiven = changeGiven; }
    public BigDecimal getRefundedAmount() { return refundedAmount; }
    public void setRefundedAmount(BigDecimal refundedAmount) { this.refundedAmount = refundedAmount; }
    public Long getRiderId() { return riderId; }
    public void setRiderId(Long riderId) { this.riderId = riderId; }
    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
    public String getGuestToken() { return guestToken; }
    public void setGuestToken(String guestToken) { this.guestToken = guestToken; }

    public String getRiderName() { return riderName; }
    public void setRiderName(String riderName) { this.riderName = riderName; }
    public String getRiderPhone() { return riderPhone; }
    public void setRiderPhone(String riderPhone) { this.riderPhone = riderPhone; }
    public boolean isAwaitingAcceptance() { return awaitingAcceptance; }
    public void setAwaitingAcceptance(boolean awaitingAcceptance) { this.awaitingAcceptance = awaitingAcceptance; }
    public LocalDateTime getAwaitingAcceptanceSince() { return awaitingAcceptanceSince; }
    public void setAwaitingAcceptanceSince(LocalDateTime awaitingAcceptanceSince) { this.awaitingAcceptanceSince = awaitingAcceptanceSince; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
    public CancelRequestStatus getCancelRequestStatus() { return cancelRequestStatus; }
    public void setCancelRequestStatus(CancelRequestStatus cancelRequestStatus) { this.cancelRequestStatus = cancelRequestStatus; }
    public String getCancelRequestReason() { return cancelRequestReason; }
    public void setCancelRequestReason(String cancelRequestReason) { this.cancelRequestReason = cancelRequestReason; }
    public LocalDateTime getCancelRequestedAt() { return cancelRequestedAt; }
    public void setCancelRequestedAt(LocalDateTime cancelRequestedAt) { this.cancelRequestedAt = cancelRequestedAt; }
    public String getCancelRequestNote() { return cancelRequestNote; }
    public void setCancelRequestNote(String cancelRequestNote) { this.cancelRequestNote = cancelRequestNote; }
    public String getCardBrand() { return cardBrand; }
    public void setCardBrand(String cardBrand) { this.cardBrand = cardBrand; }
    public String getCardLast4() { return cardLast4; }
    public void setCardLast4(String cardLast4) { this.cardLast4 = cardLast4; }
    public int getRefundAttempts() { return refundAttempts; }
    public void setRefundAttempts(int refundAttempts) { this.refundAttempts = refundAttempts; }
}
