package com.example.BigBite.order.external;

import com.example.BigBite.order.external.CardValidator;
import com.example.BigBite.order.external.mock.MockPaymentGateway;
import com.example.BigBite.order.external.PaymentGateway;
import com.example.BigBite.order.external.PaymentGateway.CardDetails;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;
import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.*;

class CardPaymentTest {

    private static final YearMonth NOW = YearMonth.of(2026, 10);
    private final MockPaymentGateway gateway = new MockPaymentGateway();

    private static CardDetails card(String number, int month, int year, String cvc) {
        return new CardDetails("Test Customer", number, month, year, cvc);
    }

    @Test
    void wellFormedCardPassesValidation() {
        assertNull(CardValidator.problemWith(card("4242424242424242", 12, 2030, "123"), NOW));
        assertNull(CardValidator.problemWith(card("4242424242424242", 10, 26, "123"), NOW), "two-digit year, current month");
    }

    @ParameterizedTest
    @CsvSource({
            "4242424242424241, 12, 2030, 123, Card number is not valid",
            "4242, 12, 2030, 123, Card number must be 13 to 19 digits",
            "4242424242424242, 13, 2030, 123, Expiry month must be between 1 and 12",
            "4242424242424242, 9, 2026, 123, Card has expired",
            "4242424242424242, 12, 2030, 12, Security code (CVC) is not valid"
    })
    void malformedCardsAreRejectedBeforeTheGateway(String number, int month, int year, String cvc, String problem) {
        assertEquals(problem, CardValidator.problemWith(card(number, month, year, cvc), NOW));
    }

    @Test
    void numberSpacesAreNormalisedAndBrandsDetected() {
        assertEquals("4242424242424242", CardValidator.normalizeNumber("4242 4242-4242 4242"));
        assertEquals("VISA", CardValidator.brandOf("4242424242424242"));
        assertEquals("MASTERCARD", CardValidator.brandOf("5555555555554444"));
        assertEquals("AMEX", CardValidator.brandOf("378282246310005"));
    }

    @Test
    void gatewayOutcomeDependsOnTheCardNotTheClient() {
        PaymentGateway.GatewayResult approved = gateway.charge(new BigDecimal("1000.00"),
                card("4242424242424242", 12, 2030, "123"), "key-1");
        assertTrue(approved.approved());
        assertNotNull(approved.reference());
        assertEquals("4242", approved.last4());

        for (String number : MockPaymentGateway.DECLINE_CARDS.keySet()) {
            PaymentGateway.GatewayResult declined = gateway.charge(new BigDecimal("1000.00"),
                    card(number, 12, 2030, "123"), "key-" + number);
            assertFalse(declined.approved(), number);
            assertEquals(MockPaymentGateway.DECLINE_CARDS.get(number)[0], declined.declineCode());
            assertTrue(CardValidator.passesLuhn(number), "test card numbers are valid card numbers");
        }
    }

    @Test
    void cardDetailsNeverPrintTheFullNumber() {
        CardDetails details = card("4242424242424242", 12, 2030, "123");
        assertFalse(details.toString().contains("42424242"));
    }
}
