package com.example.BigBite.menu.observer;

import com.example.BigBite.menu.event.MenuItemChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Component;

@Component
public class MenuItemChangeObserver {

    private static final Logger log = LoggerFactory.getLogger(MenuItemChangeObserver.class);

    @TransactionalEventListener(fallbackExecution = true)
    public void onMenuItemChanged(MenuItemChangedEvent event) {
        log.info("Menu item {}: id={}, name={}, branch={}, available={}", event.getAction(), event.getMenuId(),
                event.getMenuName(), event.getBranchId(), event.isAvailable());
    }
}
