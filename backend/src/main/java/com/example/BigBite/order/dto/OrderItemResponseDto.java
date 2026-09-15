package com.example.BigBite.order.dto;

import java.math.BigDecimal;

public class OrderItemResponseDto {

    private Long id;
    private Long menuItemId;
    private String itemNameSnapshot;
    private BigDecimal unitPriceSnapshot;
    private Integer quantity;
    private BigDecimal lineTotal;

    public OrderItemResponseDto() {
    }

    public OrderItemResponseDto(Long id, Long menuItemId, String itemNameSnapshot, BigDecimal unitPriceSnapshot, Integer quantity, BigDecimal lineTotal) {
        this.id = id;
        this.menuItemId = menuItemId;
        this.itemNameSnapshot = itemNameSnapshot;
        this.unitPriceSnapshot = unitPriceSnapshot;
        this.quantity = quantity;
        this.lineTotal = lineTotal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public String getItemNameSnapshot() {
        return itemNameSnapshot;
    }

    public void setItemNameSnapshot(String itemNameSnapshot) {
        this.itemNameSnapshot = itemNameSnapshot;
    }

    public BigDecimal getUnitPriceSnapshot() {
        return unitPriceSnapshot;
    }

    public void setUnitPriceSnapshot(BigDecimal unitPriceSnapshot) {
        this.unitPriceSnapshot = unitPriceSnapshot;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }
}
