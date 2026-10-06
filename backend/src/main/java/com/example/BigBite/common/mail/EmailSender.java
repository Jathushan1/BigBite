package com.example.BigBite.common.mail;

/** Outgoing email. SMTP when {@code spring.mail.host} is configured, otherwise an in-memory mock outbox. */
public interface EmailSender {
    void send(String to, String subject, String textBody, String actionUrl);
}
