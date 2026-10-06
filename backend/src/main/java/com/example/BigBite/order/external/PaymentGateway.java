package com.example.BigBite.order.external;

import java.math.BigDecimal;

public interface PaymentGateway {

    /** Card data lives only for the duration of the charge call; it is never stored or logged. */
    record CardDetails(String holderName, String number, int expMonth, int expYear, String cvc) {
        public String last4() {
            return number.length() >= 4 ? number.substring(number.length() - 4) : number;
        }

        @Override
        public String toString() {
            return "CardDetails[**** " + last4() + "]";
        }
    }

    record GatewayResult(boolean approved, String reference, String declineCode, String message,
                         String brand, String last4) {
        public static GatewayResult approved(String reference, String brand, String last4) {
            return new GatewayResult(true, reference, null, "Approved", brand, last4);
        }

        public static GatewayResult declined(String code, String message, String brand, String last4) {
            return new GatewayResult(false, null, code, message, brand, last4);
        }
    }

    GatewayResult charge(BigDecimal amount, CardDetails card, String idempotencyKey);
}
