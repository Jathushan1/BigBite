package com.example.BigBite.order;

import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderHttpSecurityTest {
    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    private final ObjectMapper json = new ObjectMapper();

    private String placeGuestOrder() throws Exception {
        return mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"branchId":1,"fulfillmentType":"TAKEAWAY", "guestName":"Guest",
                                 "guestPhone":"0771234567", "items":[{"menuItemId":101,"quantity":1}]}
                                """))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    }

    private User staff(Role role, long branchId) {
        User actor = new User(role.name(), role.name().toLowerCase() + "-" + java.util.UUID.randomUUID()
                + "@example.com", "secret", role, UserStatus.APPROVED);
        actor.setBranchId(branchId);
        return users.save(actor);
    }

    private String placeGuestDeliveryOrder() throws Exception {
        return mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"branchId":1,"fulfillmentType":"DELIVERY","deliveryAddress":"42 Galle Road",
                                 "guestName":"Guest", "guestPhone":"0771234567",
                                 "items":[{"menuItemId":101,"quantity":1}]}
                                """))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    }

    @Test
    void guestTokenControlsReadAndPayment() throws Exception {
        String placed = placeGuestOrder();
        long id = json.readTree(placed).get("id").asLong();
        String token = json.readTree(placed).get("guestToken").asText();
        assertFalse(token.isBlank());

        mvc.perform(get("/api/orders/{id}", id)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders/{id}", id).header("X-Guest-Token", "wrong"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/orders/{id}", id).header("X-Guest-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.id").value(id));

        mvc.perform(post("/api/orders/{id}/payment", id)
                        .header("X-Guest-Token", token)
                        .header("Idempotency-Key", "http-guest-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"CREDIT_CARD\",\"success\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_VERIFIED"));
        mvc.perform(get("/api/orders/{id}/history", id).header("X-Guest-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[1].toStatus").value("PAYMENT_VERIFIED"));
    }

    @Test
    void anonymousListAndCrossBranchManagerAreDenied() throws Exception {
        String placed = placeGuestOrder();
        long id = json.readTree(placed).get("id").asLong();
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());

        User unrelated = users.save(new User("Unrelated Customer", "unrelated-" + java.util.UUID.randomUUID()
                + "@example.com", "secret", Role.CUSTOMER, UserStatus.ACTIVE));
        mvc.perform(get("/api/orders/{id}", id).with(user(unrelated.getEmail()).roles("CUSTOMER")))
                .andExpect(status().isForbidden());

        User manager = new User("Remote Manager", "remote-manager-test@example.com", "secret",
                Role.BRANCH_MANAGER, UserStatus.APPROVED);
        manager.setBranchId(3L);
        manager = users.save(manager);
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void codDeliveryRequiresCashBeforeCompletion() throws Exception {
        String suffix = java.util.UUID.randomUUID().toString().substring(0, 8);
        User customer = users.save(new User("Customer", "customer-" + suffix + "@example.com", "secret",
                Role.CUSTOMER, UserStatus.ACTIVE));
        User manager = new User("Manager", "manager-" + suffix + "@example.com", "secret",
                Role.BRANCH_MANAGER, UserStatus.APPROVED);
        manager.setBranchId(1L);
        manager = users.save(manager);
        User rider = new User("Rider", "rider-" + suffix + "@example.com", "secret",
                Role.DELIVERY_PARTNER, UserStatus.APPROVED);
        rider.setBranchId(1L);
        rider = users.save(rider);

        String placed = mvc.perform(post("/api/orders")
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"customerId":9999,"branchId":1,"fulfillmentType":"DELIVERY",
                                 "deliveryAddress":"42 Galle Road", "items":[{"menuItemId":101,"quantity":1}]}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerId").value(customer.getId()))
                .andReturn().getResponse().getContentAsString();
        long id = json.readTree(placed).get("id").asLong();

        mvc.perform(post("/api/orders/{id}/payment", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .header("Idempotency-Key", "cod-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"CASH_ON_DELIVERY\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"));
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}"))
                .andExpect(status().isOk());
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OUT_FOR_DELIVERY\",\"riderId\":" + rider.getId() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.riderId").value(rider.getId()));
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(rider.getEmail()).roles("DELIVERY_PARTNER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/orders/{id}/cod/collect", id)
                        .with(user(rider.getEmail()).roles("DELIVERY_PARTNER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cashCollected\":2000.00}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.paymentStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.changeGiven").value(440.00));
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(rider.getEmail()).roles("DELIVERY_PARTNER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"COMPLETED\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void paidGuestCancellationUsesMockRefund() throws Exception {
        String placed = placeGuestOrder();
        long id = json.readTree(placed).get("id").asLong();
        String token = json.readTree(placed).get("guestToken").asText();
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .header("X-Guest-Token", token)
                        .header("Idempotency-Key", "paid-guest-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"DEBIT_CARD\",\"success\":true}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/orders/{id}/cancel", id).header("X-Guest-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.refundedAmount").value(1260.00));
    }

    @Test
    void codTakeawayCollectsAtCounterAndCompletesInOneCall() throws Exception {
        User customer = users.save(new User("Takeaway Customer", "takeaway-" + java.util.UUID.randomUUID()
                + "@example.com", "secret", Role.CUSTOMER, UserStatus.ACTIVE));
        User manager = staff(Role.BRANCH_MANAGER, 1L);
        String placed = mvc.perform(post("/api/orders")
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"branchId":1,"fulfillmentType":"TAKEAWAY",
                                 "items":[{"menuItemId":101,"quantity":1}]}
                                """))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        long id = json.readTree(placed).get("id").asLong();
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .header("Idempotency-Key", "takeaway-cod-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"CASH_ON_DELIVERY\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONFIRMED"));
        for (String statusName : new String[]{"PREPARING", "READY_FOR_PICKUP"}) {
            mvc.perform(put("/api/orders/{id}/status", id)
                            .with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"status\":\"" + statusName + "\"}"))
                    .andExpect(status().isOk());
        }
        mvc.perform(post("/api/orders/{id}/cod/collect", id)
                        .with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cashCollected\":1000.00}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("INSUFFICIENT_CASH"));
        mvc.perform(post("/api/orders/{id}/cod/collect", id)
                        .with(user(manager.getEmail()).roles("BRANCH_MANAGER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cashCollected\":1300.00}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.changeGiven").value(40.00));
    }

    @Test
    void cardDeliveryCompletesAndPreparationLocksCancellation() throws Exception {
        String placed = placeGuestDeliveryOrder();
        long id = json.readTree(placed).get("id").asLong();
        String token = json.readTree(placed).get("guestToken").asText();
        User manager = staff(Role.BRANCH_MANAGER, 1L);
        User rider = staff(Role.DELIVERY_PARTNER, 1L);
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .header("X-Guest-Token", token)
                        .header("Idempotency-Key", "card-delivery-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"CREDIT_CARD\",\"success\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAYMENT_VERIFIED"));
        for (String statusName : new String[]{"CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"}) {
            String actorEmail = (statusName.equals("DELIVERED") || statusName.equals("COMPLETED"))
                    ? rider.getEmail() : manager.getEmail();
            String role = (statusName.equals("DELIVERED") || statusName.equals("COMPLETED"))
                    ? "DELIVERY_PARTNER" : "BRANCH_MANAGER";
            String body = statusName.equals("OUT_FOR_DELIVERY")
                    ? "{\"status\":\"OUT_FOR_DELIVERY\",\"riderId\":" + rider.getId() + "}"
                    : "{\"status\":\"" + statusName + "\"}";
            mvc.perform(put("/api/orders/{id}/status", id)
                            .with(user(actorEmail).roles(role))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isOk());
            if (statusName.equals("PREPARING")) {
                mvc.perform(post("/api/orders/{id}/cancel", id).header("X-Guest-Token", token))
                        .andExpect(status().isConflict());
            }
        }
        mvc.perform(get("/api/orders/{id}/history", id).header("X-Guest-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[6].toStatus").value("COMPLETED"));
    }
}
