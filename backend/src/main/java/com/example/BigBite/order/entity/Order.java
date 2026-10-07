package com.example.BigBite.order.entity;

import com.example.BigBite.order.enums.CancelRequestStatus;
import com.example.BigBite.order.enums.FulfillmentType;
import com.example.BigBite.order.enums.OrderStatus;
import com.example.BigBite.order.enums.PaymentMethod;
import com.example.BigBite.order.enums.PaymentStatus;
import com.example.BigBite.order.enums.RefundStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "customer_id", nullable = true)
    private Long customerId;

    @Column(name = "contact_name", nullable = true)
    private String contactName;

    @Column(name = "contact_phone", nullable = true)
    private String contactPhone;

    @Column(name = "guest_name", nullable = true)
    private String guestName;

    @Column(name = "guest_phone", nullable = true)
    private String guestPhone;

    @Column(name = "guest_email", nullable = true)
    private String guestEmail;

    @Column(name = "branch_id", nullable = false)
    private Long branchId;

    @Column(name = "branch_name_snapshot", nullable = true)
    private String branchNameSnapshot;

    @Column(name = "branch_address_snapshot", nullable = true)
    private String branchAddressSnapshot;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "fulfillment_type", nullable = false)
    private FulfillmentType fulfillmentType;

    @Column(name = "delivery_address", nullable = true)
    private String deliveryAddress;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.PLACED;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "delivery_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal deliveryFee = BigDecimal.ZERO;

    @Column(name = "tax_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal grandTotal = BigDecimal.ZERO;

    @Column(name = "promo_code", nullable = true)
    private String promoCode;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "payment_status", nullable = false)
    private PaymentStatus paymentStatus = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "refund_status", nullable = false)
    private RefundStatus refundStatus = RefundStatus.NOT_APPLICABLE;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "payment_method", nullable = true)
    private PaymentMethod paymentMethod;

    @Column(name = "stripe_payment_intent_id", nullable = true)
    private String stripePaymentIntentId;

    @Column(name = "cancellation_reason", nullable = true)
    private String cancellationReason;

    @Column(name = "failure_reason", length = 32)
    private String failureReason;

    @Column(name = "payment_reference", length = 64)
    private String paymentReference;

    @Column(name = "payment_idempotency_key", length = 100)
    private String paymentIdempotencyKey;

    @Column(name = "payment_attempts", nullable = false, columnDefinition = "integer default 0")
    private int paymentAttempts;

    @Column(name = "cash_collected", precision = 10, scale = 2)
    private BigDecimal cashCollected;

    @Column(name = "change_given", precision = 10, scale = 2)
    private BigDecimal changeGiven;

    @Column(name = "refunded_amount", nullable = false, precision = 10, scale = 2,
            columnDefinition = "decimal(10,2) default 0.00")
    private BigDecimal refundedAmount = new BigDecimal("0.00");

    @Column(name = "rider_id")
    private Long riderId;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "guest_access_nonce", length = 64)
    private String guestAccessNonce;

    /** Set when the order starts waiting for staff to accept it (COD selected or card verified). */
    @Column(name = "awaiting_acceptance_since")
    private LocalDateTime awaitingAcceptanceSince;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    @Column(name = "accepted_by")
    private Long acceptedBy;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "cancel_request_status", length = 16)
    private CancelRequestStatus cancelRequestStatus;

    @Column(name = "cancel_request_reason", length = 255)
    private String cancelRequestReason;

    @Column(name = "cancel_requested_at")
    private LocalDateTime cancelRequestedAt;

    @Column(name = "cancel_request_note", length = 255)
    private String cancelRequestNote;

    @Column(name = "card_brand", length = 16)
    private String cardBrand;

    @Column(name = "card_last4", length = 4)
    private String cardLast4;

    @Column(name = "refund_attempts", nullable = false, columnDefinition = "integer default 0")
    private int refundAttempts;

    @Column(name = "last_refund_attempt_at")
    private LocalDateTime lastRefundAttemptAt;

    @Column(name = "refund_reference", length = 64)
    private String refundReference;

    @Column(name = "idempotency_key", nullable = true, unique = true, length = 100)
    private String idempotencyKey;

    @Column(name = "request_fingerprint", length = 64)
    private String requestFingerprint;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public Order() {
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = OrderStatus.PLACED;
        }
        if (this.paymentStatus == null) {
            this.paymentStatus = PaymentStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }

    // Getters and Setters

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
        if (this.guestName == null) {
            this.guestName = contactName;
        }
    }

    public String getContactPhone() {
        return contactPhone != null ? contactPhone : guestPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
        if (this.guestPhone == null) {
            this.guestPhone = contactPhone;
        }
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

    public String getStripePaymentIntentId() {
        return stripePaymentIntentId;
    }

    public void setStripePaymentIntentId(String stripePaymentIntentId) {
        this.stripePaymentIntentId = stripePaymentIntentId;
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

    public List<OrderItem> getItems() {
        return items;
    }

    public void setItems(List<OrderItem> items) {
        this.items = items;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getRequestFingerprint() { return requestFingerprint; }
    public void setRequestFingerprint(String requestFingerprint) { this.requestFingerprint = requestFingerprint; }

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
    public String getPaymentIdempotencyKey() { return paymentIdempotencyKey; }
    public void setPaymentIdempotencyKey(String paymentIdempotencyKey) { this.paymentIdempotencyKey = paymentIdempotencyKey; }
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
    public String getGuestAccessNonce() { return guestAccessNonce; }
    public void setGuestAccessNonce(String guestAccessNonce) { this.guestAccessNonce = guestAccessNonce; }
    public LocalDateTime getAwaitingAcceptanceSince() { return awaitingAcceptanceSince; }
    public void setAwaitingAcceptanceSince(LocalDateTime awaitingAcceptanceSince) { this.awaitingAcceptanceSince = awaitingAcceptanceSince; }
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
    public Long getAcceptedBy() { return acceptedBy; }
    public void setAcceptedBy(Long acceptedBy) { this.acceptedBy = acceptedBy; }
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
    public LocalDateTime getLastRefundAttemptAt() { return lastRefundAttemptAt; }
    public void setLastRefundAttemptAt(LocalDateTime lastRefundAttemptAt) { this.lastRefundAttemptAt = lastRefundAttemptAt; }
    public String getRefundReference() { return refundReference; }
    public void setRefundReference(String refundReference) { this.refundReference = refundReference; }

    /** Waiting for branch staff to accept: COD chosen (still PLACED) or card already verified. */
    public boolean isAwaitingAcceptance() {
        return status == OrderStatus.PAYMENT_VERIFIED
                || (status == OrderStatus.PLACED && paymentMethod == PaymentMethod.CASH_ON_DELIVERY);
    }
}
