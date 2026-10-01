-- Apply once after the new columns and tables exist, with a database backup.
-- This is a data backfill for orders created by the prior order module.
-- Guest orders without guest_access_nonce remain inaccessible until support recovery.


UPDATE orders
SET payment_method = 'CREDIT_CARD'
WHERE payment_method IS NULL AND payment_status = 'VERIFIED';

UPDATE orders
SET payment_status = 'REFUND_PENDING'
WHERE status = 'CANCELLED'
  AND payment_status = 'VERIFIED'
  AND refund_status = 'PENDING';

UPDATE orders
SET payment_status = 'VOIDED'
WHERE status = 'CANCELLED'
  AND payment_status IN ('PENDING', 'FAILED');

UPDATE orders
SET status = 'CONFIRMED'
WHERE payment_method = 'CASH_ON_DELIVERY'
  AND payment_status = 'PENDING'
  AND status = 'PLACED';

-- In the prior flow, COD PAYMENT_VERIFIED occurred after delivery or counter pickup.
UPDATE orders
SET status = CASE WHEN fulfillment_type = 'DELIVERY' THEN 'DELIVERED' ELSE 'COMPLETED' END
WHERE payment_method = 'CASH_ON_DELIVERY'
  AND payment_status = 'VERIFIED'
  AND status = 'PAYMENT_VERIFIED';

-- Legacy delivery orders could be marked delivered before recording cash.
-- Return them to the handover queue so the assigned branch can collect through the new endpoint.
UPDATE orders
SET status = 'OUT_FOR_DELIVERY'
WHERE payment_method = 'CASH_ON_DELIVERY'
  AND payment_status = 'PENDING'
  AND status = 'DELIVERED';

UPDATE orders
SET payment_attempts = 0
WHERE payment_attempts IS NULL;

UPDATE orders
SET refunded_amount = 0.00
WHERE refunded_amount IS NULL;

INSERT INTO order_status_history (order_id, from_status, to_status, actor_id, actor_role, note, changed_at)
SELECT o.id, NULL, o.status, NULL, 'SYSTEM', 'Legacy order state at migration', o.updated_at
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM order_status_history h WHERE h.order_id = o.id);

