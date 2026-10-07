package com.example.BigBite.order.external.mock;

import com.example.BigBite.order.external.RefundGateway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Refund simulator. {@code bigbite.mock.refund.fail-next} makes the next N refunds fail so the
 * REFUND_PENDING retry flow can be demonstrated.
 */
@Component
public class MockRefundGateway implements RefundGateway {

    private final AtomicInteger failNext;

    public MockRefundGateway(@Value("${bigbite.mock.refund.fail-next:0}") int failNext) {
        this.failNext = new AtomicInteger(failNext);
    }

    @Override
    public RefundResult refund(String paymentReference, BigDecimal amount) {
        if (failNext.getAndUpdate(n -> Math.max(0, n - 1)) > 0) {
            return new RefundResult(false, null);
        }
        return new RefundResult(true, "MOCK-REFUND-" + UUID.randomUUID());
    }

    public void failNext(int count) {
        failNext.set(count);
    }
}
