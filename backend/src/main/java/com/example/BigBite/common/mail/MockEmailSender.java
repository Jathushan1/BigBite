package com.example.BigBite.common.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

/** Keeps the last 50 emails in memory so flows like password reset can be demonstrated without a mailbox. */
public class MockEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(MockEmailSender.class);
    private static final int CAPACITY = 50;

    public record OutboxMessage(long id, String to, String subject, String body, String actionUrl, LocalDateTime sentAt) {}

    private final Deque<OutboxMessage> outbox = new ConcurrentLinkedDeque<>();
    private final AtomicLong ids = new AtomicLong();

    @Override
    public void send(String to, String subject, String textBody, String actionUrl) {
        outbox.addFirst(new OutboxMessage(ids.incrementAndGet(), to, subject, textBody, actionUrl, LocalDateTime.now()));
        while (outbox.size() > CAPACITY) {
            outbox.pollLast();
        }
        log.info("[mock-mail] to={} subject=\"{}\" (open /dev/outbox to view)", to, subject);
    }

    public List<OutboxMessage> messages() {
        return new ArrayList<>(outbox);
    }

    public void clear() {
        outbox.clear();
    }
}
