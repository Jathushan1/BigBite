package com.example.BigBite.menu.observer;

import com.example.BigBite.menu.event.MenuItemChangedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Observer: reacts to menu changes without coupling notification logic to the service. */
@Component
public class MenuItemChangeObserver {

    @EventListener
    public void onMenuItemChanged(MenuItemChangedEvent event) {
        // Replace or extend this with notifications/audit logging when those modules exist.
        System.out.println("Menu item " + event.getAction() + ": ID="
                + event.getMenuId() + ", name=" + event.getMenuName());
    }
}
