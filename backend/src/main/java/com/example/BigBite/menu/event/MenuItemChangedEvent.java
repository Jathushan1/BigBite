package com.example.BigBite.menu.event;

/** Event published after a menu item is created, updated, or deleted. */
public class MenuItemChangedEvent {
    private final String action;
    private final Long menuId;
    private final String menuName;

    public MenuItemChangedEvent(String action, Long menuId, String menuName) {
        this.action = action;
        this.menuId = menuId;
        this.menuName = menuName;
    }

    public String getAction() { return action; }
    public Long getMenuId() { return menuId; }
    public String getMenuName() { return menuName; }
}
