package com.example.BigBite.order.controller;

import com.example.BigBite.order.service.OrderRateLimiter;
import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.branch.BranchSaleRepository;
import com.example.BigBite.branch.OrderSalesRecorder;
import com.example.BigBite.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static com.example.BigBite.support.TestFixtures.APPROVED_CARD;
import static com.example.BigBite.support.TestFixtures.cardPayment;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class OrderHttpSecurityTest {
    @Autowired private MockMvc mvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private BranchSaleRepository sales;
    @Autowired private OrderRateLimiter rateLimiter;
    private final ObjectMapper json = new ObjectMapper();

    private Branch branch;
    private long itemId;

    @BeforeEach
    void seed() {
        rateLimiter.reset();
        branch = fixtures.branch();
        itemId = fixtures.menuItem(branch, "1200.00").getMenuId();
    }

    private String guestOrder(String fulfillment) throws Exception {
        String address = fulfillment.equals("DELIVERY") ? "\"deliveryAddress\":\"42 Galle Road\"," : "";
        return mvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"branchId\":" + branch.getId() + ",\"fulfillmentType\":\"" + fulfillment + "\","
                                + address + "\"guestName\":\"Guest\",\"guestPhone\":\"0771234567\","
                                + "\"items\":[{\"menuItemId\":" + itemId + ",\"quantity\":1}]}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
    }

    private String customerOrder(User customer, String fulfillment) throws Exception {
        String address = fulfillment.equals("DELIVERY") ? "\"deliveryAddress\":\"42 Galle Road\"," : "";
        return mvc.perform(post("/api/orders")
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":9999,\"branchId\":" + branch.getId() + ",\"fulfillmentType\":\""
                                + fulfillment + "\"," + address
                                + "\"items\":[{\"menuItemId\":" + itemId + ",\"quantity\":1}]}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.customerId").value(customer.getId()))
                .andReturn().getResponse().getContentAsString();
    }

    private void moveAs(User actor, String role, long id, String body) throws Exception {
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(actor.getEmail()).roles(role))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());
    }

    @Test
    void guestTokenControlsReadAndPayment() throws Exception {
        String placed = guestOrder("TAKEAWAY");
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
                        .content(cardPayment("CREDIT_CARD", APPROVED_CARD)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAYMENT_VERIFIED"))
                .andExpect(jsonPath("$.awaitingAcceptance").value(true))
                .andExpect(jsonPath("$.cardLast4").value("4242"));
        mvc.perform(get("/api/orders/{id}/history", id).header("X-Guest-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[1].toStatus").value("PAYMENT_VERIFIED"));
    }

    @Test
    void anonymousListAndOtherBranchStaffAreDenied() throws Exception {
        long id = json.readTree(guestOrder("TAKEAWAY")).get("id").asLong();
        mvc.perform(get("/api/orders")).andExpect(status().isUnauthorized());

        User unrelated = fixtures.customer();
        mvc.perform(get("/api/orders/{id}", id).with(user(unrelated.getEmail()).roles("CUSTOMER")))
                .andExpect(status().isForbidden());

        Branch other = fixtures.branch();
        User remoteStaff = fixtures.user(Role.STAFF, other.getId());
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(remoteStaff.getEmail()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"CONFIRMED\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void branchManagerSeesOrdersButCannotChangeThem() throws Exception {
        long id = json.readTree(guestOrder("TAKEAWAY")).get("id").asLong();
        User manager = fixtures.user(Role.BRANCH_MANAGER, branch.getId());
        mvc.perform(get("/api/orders/{id}", id).with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isOk());
        mvc.perform(get("/api/orders").with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(post("/api/orders/{id}/accept", id).with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.error").value("STAFF_REQUIRED"));
        mvc.perform(post("/api/orders/{id}/cancel", id).with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void codDeliveryWaitsForStaffAndRequiresCashBeforeCompletion() throws Exception {
        User customer = fixtures.customer();
        User staff = fixtures.user(Role.STAFF, branch.getId());
        User rider = fixtures.user(Role.DELIVERY_PARTNER, branch.getId());
        long id = json.readTree(customerOrder(customer, "DELIVERY")).get("id").asLong();

        mvc.perform(post("/api/orders/{id}/payment", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .header("Idempotency-Key", "cod-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"CASH_ON_DELIVERY\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PLACED"))
                .andExpect(jsonPath("$.awaitingAcceptance").value(true))
                .andExpect(jsonPath("$.paymentStatus").value("PENDING"));
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(staff.getEmail()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}"))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/orders/{id}/accept", id).with(user(staff.getEmail()).roles("STAFF")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.awaitingAcceptance").value(false));
        moveAs(staff, "STAFF", id, "{\"status\":\"PREPARING\"}");
        mvc.perform(get("/api/orders/riders").with(user(staff.getEmail()).roles("STAFF")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].riderId").value(rider.getId()));
        mvc.perform(put("/api/orders/{id}/status", id)
                        .with(user(staff.getEmail()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OUT_FOR_DELIVERY\",\"riderId\":" + rider.getId() + "}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.riderId").value(rider.getId()))
                .andExpect(jsonPath("$.riderName").value(rider.getName()));
        mvc.perform(get("/api/orders/{id}/tracking", id).with(user(customer.getEmail()).roles("CUSTOMER")))
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
        moveAs(rider, "DELIVERY_PARTNER", id, "{\"status\":\"COMPLETED\"}");

        assertTrue(sales.existsByOrderNumber(OrderSalesRecorder.orderNumberFor(id)),
                "a completed order is recorded as a branch sale");
    }

    @Test
    void paidGuestCancellationBeforeAcceptanceUsesMockRefund() throws Exception {
        String placed = guestOrder("TAKEAWAY");
        long id = json.readTree(placed).get("id").asLong();
        String token = json.readTree(placed).get("guestToken").asText();
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .header("X-Guest-Token", token)
                        .header("Idempotency-Key", "paid-guest-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cardPayment("DEBIT_CARD", APPROVED_CARD)))
                .andExpect(status().isOk());
        mvc.perform(post("/api/orders/{id}/cancel", id).header("X-Guest-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.refundedAmount").value(1260.00));
    }

    @Test
    void codTakeawayCollectsAtCounterAndCompletesInOneCall() throws Exception {
        User customer = fixtures.customer();
        User staff = fixtures.user(Role.STAFF, branch.getId());
        long id = json.readTree(customerOrder(customer, "TAKEAWAY")).get("id").asLong();
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .header("Idempotency-Key", "takeaway-cod-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"method\":\"CASH_ON_DELIVERY\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PLACED"));
        for (String statusName : new String[]{"CONFIRMED", "PREPARING", "READY_FOR_PICKUP"}) {
            moveAs(staff, "STAFF", id, "{\"status\":\"" + statusName + "\"}");
        }
        mvc.perform(post("/api/orders/{id}/cod/collect", id)
                        .with(user(staff.getEmail()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cashCollected\":1000.00}"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("INSUFFICIENT_CASH"));
        mvc.perform(post("/api/orders/{id}/cod/collect", id)
                        .with(user(staff.getEmail()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"cashCollected\":1300.00}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.changeGiven").value(40.00));
    }

    @Test
    void cardDeliveryCompletesAndPreparationRequiresCancelRequest() throws Exception {
        String placed = guestOrder("DELIVERY");
        long id = json.readTree(placed).get("id").asLong();
        String token = json.readTree(placed).get("guestToken").asText();
        User staff = fixtures.user(Role.STAFF, branch.getId());
        User rider = fixtures.user(Role.DELIVERY_PARTNER, branch.getId());
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .header("X-Guest-Token", token)
                        .header("Idempotency-Key", "card-delivery-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cardPayment("CREDIT_CARD", APPROVED_CARD)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PAYMENT_VERIFIED"));
        for (String statusName : new String[]{"CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"}) {
            boolean riderStep = statusName.equals("DELIVERED") || statusName.equals("COMPLETED");
            String body = statusName.equals("OUT_FOR_DELIVERY")
                    ? "{\"status\":\"OUT_FOR_DELIVERY\",\"riderId\":" + rider.getId() + "}"
                    : "{\"status\":\"" + statusName + "\"}";
            moveAs(riderStep ? rider : staff, riderStep ? "DELIVERY_PARTNER" : "STAFF", id, body);
            if (statusName.equals("PREPARING")) {
                mvc.perform(post("/api/orders/{id}/cancel", id).header("X-Guest-Token", token))
                        .andExpect(status().isConflict())
                        .andExpect(jsonPath("$.error").value("CANCEL_REQUEST_REQUIRED"));
            }
        }
        mvc.perform(get("/api/orders/{id}/history", id).header("X-Guest-Token", token))
                .andExpect(status().isOk()).andExpect(jsonPath("$[6].toStatus").value("COMPLETED"));
    }
}
