package com.example.BigBite.common.mail;

import com.example.BigBite.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read the mock outbox. Only exists in practice while {@code app.mail.mock=true}; access is controlled
 * in SecurityConfig ({@code app.mail.outbox-public}).
 */
@RestController
@RequestMapping("/api/dev/outbox")
public class DevOutboxController {

    private final EmailSender emailSender;

    public DevOutboxController(EmailSender emailSender) {
        this.emailSender = emailSender;
    }

    @GetMapping
    public ResponseEntity<List<MockEmailSender.OutboxMessage>> list() {
        return ResponseEntity.ok(mock().messages());
    }

    @DeleteMapping
    public ResponseEntity<Void> clear() {
        mock().clear();
        return ResponseEntity.noContent().build();
    }

    private MockEmailSender mock() {
        if (emailSender instanceof MockEmailSender mock) {
            return mock;
        }
        throw new ApiException(HttpStatus.NOT_FOUND, "OUTBOX_DISABLED", "The mock outbox is disabled because real email is configured");
    }
}
