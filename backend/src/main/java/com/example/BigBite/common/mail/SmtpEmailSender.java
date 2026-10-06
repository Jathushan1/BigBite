package com.example.BigBite.common.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

public class SmtpEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailSender.class);

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpEmailSender(JavaMailSender mailSender, String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void send(String to, String subject, String textBody, String actionUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(actionUrl == null ? textBody : textBody + "\n\n" + actionUrl);
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            // Never reveal delivery failures to the caller (that would leak which accounts exist).
            log.error("Could not send email to {}: {}", to, ex.getMessage());
        }
    }
}
