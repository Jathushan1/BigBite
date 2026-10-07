package com.example.BigBite.order.external.mock;

import com.example.BigBite.order.external.CardValidator;
import com.example.BigBite.order.external.PaymentGateway;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

/**
 * Server-side card gateway simulator. The outcome depends only on the card number, never on a client flag.
 * Any valid card number is approved unless it is one of the documented decline test cards.
 */
@Component
public class MockPaymentGateway implements PaymentGateway {

    public static final Map<String, String[]> DECLINE_CARDS = Map.of(
            "4000000000000002", new String[]{"CARD_DECLINED", "Your card was declined"},
            "4000000000009995", new String[]{"INSUFFICIENT_FUNDS", "Your card has insufficient funds"},
            "4000000000000069", new String[]{"EXPIRED_CARD", "Your card has expired"},
            "4000000000000127", new String[]{"INCORRECT_CVC", "Your card's security code is incorrect"});

    @Override
    public GatewayResult charge(BigDecimal amount, CardDetails card, String idempotencyKey) {
        String brand = CardValidator.brandOf(card.number());
        String[] decline = DECLINE_CARDS.get(card.number());
        if (decline != null) {
            return GatewayResult.declined(decline[0], decline[1], brand, card.last4());
        }
        String reference = "MOCK-" + UUID.nameUUIDFromBytes(idempotencyKey.getBytes(StandardCharsets.UTF_8));
        return GatewayResult.approved(reference, brand, card.last4());
    }
}
