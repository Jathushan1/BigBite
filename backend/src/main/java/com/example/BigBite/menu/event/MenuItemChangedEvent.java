package com.example.BigBite.menu.event;

public class MenuItemChangedEvent {
    private final String action;
    private final Long menuId;
    private final String menuName;
    private final Long branchId;
    private final boolean available;

    public MenuItemChangedEvent(String action, Long menuId, String menuName, Long branchId, boolean available) {
        this.action = action;
        this.menuId = menuId;
        this.menuName = menuName;
        this.branchId = branchId;
        this.available = available;
    }

    public String getAction() { return action; }
    public Long getMenuId() { return menuId; }
    public String getMenuName() { return menuName; }
    public Long getBranchId() { return branchId; }
    public boolean isAvailable() { return available; }
}
