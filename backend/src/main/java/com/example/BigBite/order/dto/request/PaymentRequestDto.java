package com.example.BigBite.order.dto.request;

import com.example.BigBite.order.enums.PaymentMethod;
import com.fasterxml.jackson.annotation.JsonAlias;

/**
 * Payment choice for an order. Card payments carry the card itself; whether the charge succeeds is decided
 * by the gateway on the server, never by the client.
 */
public class PaymentRequestDto {

    @JsonAlias("method")
    private PaymentMethod paymentMethod = PaymentMethod.CREDIT_CARD;
    private CardDto card;

    public PaymentRequestDto() {
    }

    public PaymentRequestDto(PaymentMethod paymentMethod, CardDto card) {
        this.paymentMethod = paymentMethod;
        this.card = card;
    }

    public static PaymentRequestDto cod() {
        return new PaymentRequestDto(PaymentMethod.CASH_ON_DELIVERY, null);
    }

    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public CardDto getCard() { return card; }
    public void setCard(CardDto card) { this.card = card; }

    public record CardDto(String holderName, String number, Integer expMonth, Integer expYear, String cvc) {
        @Override
        public String toString() {
            return "CardDto[redacted]";
        }
    }
}
