package com.example.BigBite.order.external;

import java.time.YearMonth;

/** Format checks that run before a card reaches the gateway: digits, Luhn checksum, expiry and CVC. */
public final class CardValidator {

    private CardValidator() { }

    public static String normalizeNumber(String number) {
        return number == null ? "" : number.replaceAll("[\\s-]", "");
    }

    /** Returns null when the card is well formed, otherwise a customer-facing reason. */
    public static String problemWith(PaymentGateway.CardDetails card, YearMonth now) {
        if (card == null) return "Card details are required";
        if (card.holderName() == null || card.holderName().isBlank()) return "Cardholder name is required";
        String number = card.number();
        if (number == null || !number.matches("\\d{13,19}")) return "Card number must be 13 to 19 digits";
        if (!passesLuhn(number)) return "Card number is not valid";
        if (card.expMonth() < 1 || card.expMonth() > 12) return "Expiry month must be between 1 and 12";
        int year = card.expYear() < 100 ? 2000 + card.expYear() : card.expYear();
        if (YearMonth.of(year, card.expMonth()).isBefore(now)) return "Card has expired";
        String expectedCvc = "AMEX".equals(brandOf(number)) ? "\\d{4}" : "\\d{3}";
        if (card.cvc() == null || !card.cvc().matches(expectedCvc)) return "Security code (CVC) is not valid";
        return null;
    }

    public static boolean passesLuhn(String number) {
        int sum = 0;
        boolean doubleIt = false;
        for (int i = number.length() - 1; i >= 0; i--) {
            int digit = number.charAt(i) - '0';
            if (doubleIt) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            doubleIt = !doubleIt;
        }
        return sum % 10 == 0;
    }

    public static String brandOf(String number) {
        if (number == null || number.isEmpty()) return "UNKNOWN";
        if (number.startsWith("4")) return "VISA";
        if (number.matches("^(5[1-5]|2[2-7]).*")) return "MASTERCARD";
        if (number.matches("^3[47].*")) return "AMEX";
        return "CARD";
    }
}
