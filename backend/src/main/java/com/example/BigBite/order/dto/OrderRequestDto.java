package com.example.BigBite.order.dto;

import com.example.BigBite.order.FulfillmentType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class OrderRequestDto {

    private Long customerId;
    private String contactName;
    private String contactPhone;
    private String guestName;
    private String guestPhone;
    private String guestEmail;

    @NotNull(message = "branchId is required")
    private Long branchId;

    @NotNull(message = "fulfillmentType is required")
    private FulfillmentType fulfillmentType;

    private String deliveryAddress;
    private String city;
    private boolean saveAddress;
    private String promoCode;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequestDto> items;

    public OrderRequestDto() {
    }

    public String getEffectiveContactName() {
        if (contactName != null && !contactName.trim().isEmpty()) {
            return contactName.trim();
        }
        return guestName != null && !guestName.trim().isEmpty() ? guestName.trim() : null;
    }

    public String getEffectiveContactPhone() {
        if (contactPhone != null && !contactPhone.trim().isEmpty()) {
            return contactPhone.trim();
        }
        return guestPhone != null && !guestPhone.trim().isEmpty() ? guestPhone.trim() : null;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public String getContactName() {
        return contactName;
    }

    public void setContactName(String contactName) {
        this.contactName = contactName;
    }

    public String getContactPhone() {
        return contactPhone;
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

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public boolean isSaveAddress() {
        return saveAddress;
    }

    public void setSaveAddress(boolean saveAddress) {
        this.saveAddress = saveAddress;
    }

    public String getPromoCode() {
        return promoCode;
    }

    public void setPromoCode(String promoCode) {
        this.promoCode = promoCode;
    }

    public List<OrderItemRequestDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemRequestDto> items) {
        this.items = items;
    }
}
