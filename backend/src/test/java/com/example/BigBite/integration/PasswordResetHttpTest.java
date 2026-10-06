package com.example.BigBite.integration;

import com.example.BigBite.auth.password.PasswordResetService;
import com.example.BigBite.common.mail.EmailSender;
import com.example.BigBite.common.mail.MockEmailSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PasswordResetHttpTest {
    @Autowired private MockMvc mvc;
    @Autowired private EmailSender emailSender;
    @Autowired private JdbcTemplate jdbc;
    private final ObjectMapper json = new ObjectMapper();

    private String email;
    private String ip;

    @BeforeEach
    void register() throws Exception {
        ((MockEmailSender) emailSender).clear();
        email = "reset-" + UUID.randomUUID() + "@example.com";
        ip = "10.0." + (int) (Math.random() * 200) + "." + (int) (Math.random() * 200);
        mvc.perform(post("/api/auth/register/customer").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Reset User\",\"email\":\"" + email + "\",\"phoneNumber\":\"0771234567\","
                                + "\"password\":\"Original@123\"}"))
                .andExpect(status().isCreated());
    }

    private MockHttpServletRequestBuilder fromIp(MockHttpServletRequestBuilder request) {
        return request.with(r -> {
            r.setRemoteAddr(ip);
            return r;
        });
    }

    private void requestReset(String address) throws Exception {
        mvc.perform(fromIp(post("/api/auth/forgot-password")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + address + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(PasswordResetService.GENERIC_RESPONSE));
    }

    private String latestToken() {
        MockEmailSender.OutboxMessage message = ((MockEmailSender) emailSender).messages().getFirst();
        assertEquals(email, message.to());
        return message.actionUrl().substring(message.actionUrl().indexOf("token=") + 6);
    }

    private String login(String password, int expectedStatus) throws Exception {
        String body = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().is(expectedStatus)).andReturn().getResponse().getContentAsString();
        return expectedStatus == 200 ? json.readTree(body).get("token").asText() : null;
    }

    private void reset(String token, String password, int expectedStatus) throws Exception {
        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + token + "\",\"newPassword\":\"" + password + "\"}"))
                .andExpect(status().is(expectedStatus));
    }

    @Test
    void fullResetFlowEndsOldSessionsAndTokensAreSingleUse() throws Exception {
        String oldJwt = login("Original@123", 200);
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + oldJwt)).andExpect(status().isOk());

        Thread.sleep(1100); // JWT iat has second precision
        requestReset(email);
        String token = latestToken();
        reset(token, "weak", 400);
        reset(token, "Brand@New456", 200);
        reset(token, "Another@789", 400);

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + oldJwt)).andExpect(status().isUnauthorized());
        login("Original@123", 401);
        String newJwt = login("Brand@New456", 200);
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + newJwt)).andExpect(status().isOk());
    }

    @Test
    void unknownEmailGetsTheSameAnswerAndNoEmail() throws Exception {
        requestReset("nobody-" + UUID.randomUUID() + "@example.com");
        assertTrue(((MockEmailSender) emailSender).messages().isEmpty());
    }

    @Test
    void newerRequestSupersedesOlderTokenAndExpiredTokensFail() throws Exception {
        requestReset(email);
        String first = latestToken();
        requestReset(email);
        String second = latestToken();
        assertNotEquals(first, second);
        reset(first, "Brand@New456", 400);

        jdbc.update("UPDATE password_reset_tokens SET expires_at = ? WHERE used_at IS NULL",
                LocalDateTime.now().minusMinutes(1));
        mvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"" + second + "\",\"newPassword\":\"Brand@New456\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("INVALID_RESET_TOKEN"));
    }

    @Test
    void repeatedRequestsAreRateLimited() throws Exception {
        for (int i = 0; i < 3; i++) {
            requestReset(email);
        }
        mvc.perform(fromIp(post("/api/auth/forgot-password")).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isTooManyRequests()).andExpect(jsonPath("$.error").value("RATE_LIMITED"));
    }

    @Test
    void loggedInUserCanChangePassword() throws Exception {
        String jwt = login("Original@123", 200);
        mvc.perform(put("/api/auth/change-password").header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Wrong@123\",\"newPassword\":\"Brand@New456\"}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.error").value("WRONG_PASSWORD"));
        mvc.perform(put("/api/auth/change-password").header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"Original@123\",\"newPassword\":\"Brand@New456\"}"))
                .andExpect(status().isOk());
        login("Brand@New456", 200);
    }
}
