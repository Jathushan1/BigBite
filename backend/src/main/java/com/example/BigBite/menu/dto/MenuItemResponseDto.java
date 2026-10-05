package com.example.BigBite.menu.dto;

import com.example.BigBite.menu.entity.MenuItem;

import java.math.BigDecimal;

public class MenuItemResponseDto {

    private Long menuId;
    private String menuName;
    private String category;
    private String description;
    private BigDecimal price;
    private String photo;
    private boolean availability;
    private Long branchId;
    private String branchName;

    public MenuItemResponseDto() {
    }

    public static MenuItemResponseDto fromEntity(MenuItem menuItem) {
        if (menuItem == null) {
            return null;
        }
        MenuItemResponseDto dto = new MenuItemResponseDto();
        dto.setMenuId(menuItem.getMenuId());
        dto.setMenuName(menuItem.getMenuName());
        dto.setCategory(menuItem.getCategory());
        dto.setDescription(menuItem.getDescription());
        dto.setPrice(menuItem.getPrice());
        dto.setPhoto(menuItem.getPhoto());
        dto.setAvailability(menuItem.isAvailability());
        if (menuItem.getBranch() != null) {
            dto.setBranchId(menuItem.getBranch().getId());
            dto.setBranchName(menuItem.getBranch().getName());
        }
        return dto;
    }

    public Long getMenuId() {
        return menuId;
    }

    public void setMenuId(Long menuId) {
        this.menuId = menuId;
    }

    public String getMenuName() {
        return menuName;
    }

    public void setMenuName(String menuName) {
        this.menuName = menuName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public boolean isAvailability() {
        return availability;
    }

    public void setAvailability(boolean availability) {
        this.availability = availability;
    }

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }
}
