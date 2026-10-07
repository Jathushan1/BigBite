package com.example.BigBite.order.controller;

import com.example.BigBite.order.service.OrderRateLimiter;
import com.example.BigBite.order.service.OrderService;
import com.example.BigBite.auth.Role;
import com.example.BigBite.auth.User;
import com.example.BigBite.branch.Branch;
import com.example.BigBite.order.external.mock.MockRefundGateway;
import com.example.BigBite.support.TestFixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;

import static com.example.BigBite.support.TestFixtures.APPROVED_CARD;
import static com.example.BigBite.support.TestFixtures.DECLINED_CARD;
import static com.example.BigBite.support.TestFixtures.cardPayment;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** End-to-end rules of the completed order module: acceptance, cancellations, refunds, payments, feedback. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestFixtures.class)
class OrderLifecycleHttpTest {
    @Autowired private MockMvc mvc;
    @Autowired private TestFixtures fixtures;
    @Autowired private OrderRateLimiter rateLimiter;
    @Autowired private MockRefundGateway refundGateway;
    @Autowired private OrderService orderService;
    @Autowired private JdbcTemplate jdbc;
    private final ObjectMapper json = new ObjectMapper();

    private Branch branch;
    private long itemId;
    private User customer;
    private User staff;

    @BeforeEach
    void seed() {
        rateLimiter.reset();
        refundGateway.failNext(0);
        branch = fixtures.branch();
        itemId = fixtures.menuItem(branch, "1200.00").getMenuId();
        customer = fixtures.customer();
        staff = fixtures.user(Role.STAFF, branch.getId());
    }

    private long placeCustomerOrder() throws Exception {
        String body = mvc.perform(post("/api/orders")
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"branchId\":" + branch.getId() + ",\"fulfillmentType\":\"TAKEAWAY\","
                                + "\"items\":[{\"menuItemId\":" + itemId + ",\"quantity\":1}]}"))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    private void payByCard(long id, String cardJson, int expectedStatus) throws Exception {
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .header("Idempotency-Key", "pay-" + id + "-" + System.nanoTime())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cardPayment("CREDIT_CARD", cardJson)))
                .andExpect(status().is(expectedStatus));
    }

    private void staffPost(String path, long id, String body, int expectedStatus) throws Exception {
        var request = post(path, id).with(user(staff.getEmail()).roles("STAFF"));
        if (body != null) request = request.contentType(MediaType.APPLICATION_JSON).content(body);
        mvc.perform(request).andExpect(status().is(expectedStatus));
    }

    private JsonNode getOrder(long id) throws Exception {
        return json.readTree(mvc.perform(get("/api/orders/{id}", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER")))
                .andReturn().getResponse().getContentAsString());
    }

    @Test
    void staffRejectionCancelsAndRefundsAPaidOrder() throws Exception {
        long id = placeCustomerOrder();
        payByCard(id, APPROVED_CARD, 200);
        staffPost("/api/orders/{id}/reject", id, "{\"reason\":\"\"}", 400);
        staffPost("/api/orders/{id}/reject", id, "{\"reason\":\"Kitchen closed for maintenance\"}", 200);

        JsonNode order = getOrder(id);
        assertEquals("CANCELLED", order.get("status").asText());
        assertEquals("REJECTED_BY_BRANCH", order.get("cancellationReason").asText());
        assertEquals("REFUNDED", order.get("paymentStatus").asText());
        staffPost("/api/orders/{id}/accept", id, null, 409);
    }

    @Test
    void cancellationRequestAfterAcceptanceIsDecidedByStaff() throws Exception {
        long id = placeCustomerOrder();
        payByCard(id, APPROVED_CARD, 200);
        staffPost("/api/orders/{id}/accept", id, null, 200);

        mvc.perform(post("/api/orders/{id}/cancel", id).with(user(customer.getEmail()).roles("CUSTOMER")))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("CANCEL_REQUEST_REQUIRED"));
        mvc.perform(post("/api/orders/{id}/cancel-request", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Ordered by mistake\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.cancelRequestStatus").value("PENDING"));
        mvc.perform(post("/api/orders/{id}/cancel-request", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Again\"}"))
                .andExpect(status().isConflict());

        mvc.perform(get("/api/orders/cancel-requests").with(user(staff.getEmail()).roles("STAFF")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(put("/api/orders/{id}/status", id).with(user(staff.getEmail()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("CANCEL_REQUEST_PENDING"));

        staffPost("/api/orders/{id}/cancel-request/approve", id, "{\"note\":\"No problem\"}", 200);
        JsonNode order = getOrder(id);
        assertEquals("CANCELLED", order.get("status").asText());
        assertEquals("APPROVED", order.get("cancelRequestStatus").asText());
        assertEquals("REFUNDED", order.get("paymentStatus").asText());
    }

    @Test
    void declinedCancellationLetsTheKitchenContinue() throws Exception {
        long id = placeCustomerOrder();
        payByCard(id, APPROVED_CARD, 200);
        staffPost("/api/orders/{id}/accept", id, null, 200);
        mvc.perform(post("/api/orders/{id}/cancel-request", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"Too slow\"}"))
                .andExpect(status().isOk());
        staffPost("/api/orders/{id}/cancel-request/decline", id, "{\"note\":\"Already cooking\"}", 200);
        mvc.perform(put("/api/orders/{id}/status", id).with(user(staff.getEmail()).roles("STAFF"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"PREPARING\"}"))
                .andExpect(status().isOk());
        assertEquals("DECLINED", getOrder(id).get("cancelRequestStatus").asText());
    }

    @Test
    void failedRefundStaysPendingUntilStaffRetry() throws Exception {
        long id = placeCustomerOrder();
        payByCard(id, APPROVED_CARD, 200);
        refundGateway.failNext(1);
        staffPost("/api/orders/{id}/reject", id, "{\"reason\":\"Out of dough\"}", 200);
        JsonNode pending = getOrder(id);
        assertEquals("REFUND_PENDING", pending.get("paymentStatus").asText());
        assertEquals("PENDING", pending.get("refundStatus").asText());

        mvc.perform(get("/api/orders/refunds").with(user(staff.getEmail()).roles("STAFF")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].id").value(id));
        staffPost("/api/orders/{id}/refund/retry", id, null, 200);
        assertEquals("REFUNDED", getOrder(id).get("paymentStatus").asText());
        staffPost("/api/orders/{id}/refund/retry", id, null, 409);
    }

    @Test
    void invalidCardIsRejectedWithoutUsingAnAttemptAndDeclinesCountDown() throws Exception {
        long id = placeCustomerOrder();
        mvc.perform(post("/api/orders/{id}/payment", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .header("Idempotency-Key", "bad-card-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cardPayment("CREDIT_CARD",
                                "{\"holderName\":\"X\",\"number\":\"4242424242424241\",\"expMonth\":12,\"expYear\":2035,\"cvc\":\"123\"}")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("INVALID_CARD_DETAILS"));
        assertEquals(0, getOrder(id).get("paymentAttempts").asInt());

        mvc.perform(post("/api/orders/{id}/payment", id)
                        .with(user(customer.getEmail()).roles("CUSTOMER"))
                        .header("Idempotency-Key", "decline-" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cardPayment("CREDIT_CARD", DECLINED_CARD)))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.error").value("PAYMENT_DECLINED"))
                .andExpect(jsonPath("$.declineCode").value("CARD_DECLINED"))
                .andExpect(jsonPath("$.attemptsRemaining").value(2));
        payByCard(id, APPROVED_CARD, 200);
        assertEquals("PAYMENT_VERIFIED", getOrder(id).get("status").asText());
    }

    @Test
    void ordersNobodyAcceptsAreRejectedAutomatically() throws Exception {
        long id = placeCustomerOrder();
        payByCard(id, APPROVED_CARD, 200);
        jdbc.update("UPDATE orders SET awaiting_acceptance_since = ? WHERE id = ?",
                LocalDateTime.now().minusMinutes(30), id);
        assertTrue(orderService.autoRejectUnacceptedOrders(10) >= 1);
        JsonNode order = getOrder(id);
        assertEquals("CANCELLED", order.get("status").asText());
        assertEquals("NOT_ACCEPTED", order.get("cancellationReason").asText());
        assertEquals("REFUNDED", order.get("paymentStatus").asText());
    }

    @Test
    void reviewsAndComplaintsFollowTheOrderLifecycle() throws Exception {
        long id = placeCustomerOrder();
        payByCard(id, APPROVED_CARD, 200);
        mvc.perform(post("/api/orders/{id}/review", id).with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":5}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("REVIEW_NOT_ALLOWED"));
        mvc.perform(post("/api/orders/{id}/complaints", id).with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"category\":\"FOOD_QUALITY\",\"description\":\"Pizza arrived cold\"}"))
                .andExpect(status().isConflict());

        for (String next : new String[]{"CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"}) {
            mvc.perform(put("/api/orders/{id}/status", id).with(user(staff.getEmail()).roles("STAFF"))
                            .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + next + "\"}"))
                    .andExpect(status().isOk());
        }
        mvc.perform(get("/api/orders/{id}/feedback", id).with(user(customer.getEmail()).roles("CUSTOMER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.canReview").value(true))
                .andExpect(jsonPath("$.canComplain").value(true));
        mvc.perform(post("/api/orders/{id}/review", id).with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":6}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/orders/{id}/review", id).with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":5,\"comment\":\"Great crust\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.rating").value(5));
        mvc.perform(post("/api/orders/{id}/review", id).with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"rating\":4}"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.error").value("ALREADY_REVIEWED"));
        mvc.perform(post("/api/orders/{id}/complaints", id).with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"category\":\"NONSENSE\",\"description\":\"Pizza arrived cold\"}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/orders/{id}/complaints", id).with(user(customer.getEmail()).roles("CUSTOMER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"category\":\"FOOD_QUALITY\",\"description\":\"Pizza was a little cold\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("OPEN"));

        User manager = fixtures.user(Role.BRANCH_MANAGER, branch.getId());
        mvc.perform(get("/api/orders/complaints").with(user(manager.getEmail()).roles("BRANCH_MANAGER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].orderId").value(id));
        mvc.perform(get("/api/orders/reviews").with(user(staff.getEmail()).roles("STAFF")))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].rating").value(5));
    }
}
