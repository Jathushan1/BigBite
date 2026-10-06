package com.example.BigBite.common.mail;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

@Configuration
public class MailConfig {

    /**
     * Uses real SMTP when {@code app.mail.mock=false} and a JavaMailSender is available
     * (i.e. {@code spring.mail.host} is set); otherwise falls back to the in-memory outbox.
     */
    @Bean
    public EmailSender emailSender(ObjectProvider<JavaMailSender> javaMailSender,
                                   @Value("${app.mail.mock:true}") boolean mock,
                                   @Value("${app.mail.from:BigBite <no-reply@bigbite.lk>}") String from) {
        JavaMailSender smtp = javaMailSender.getIfAvailable();
        if (!mock && smtp != null) {
            return new SmtpEmailSender(smtp, from);
        }
        return new MockEmailSender();
    }
}
