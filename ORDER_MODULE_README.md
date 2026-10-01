# BigBite Order & Billing Module

This module implements guest and account checkout, server-priced bills, mock card charges, cash on delivery, cancellation and refunds, delivery handover, and order history. The attached `ORDER_MODULE_README.md` supplied by the project owner is the business specification; `ORDER_MODULE_IMPLEMENTATION_PLAN.md` records the agreed choices and build phases.

## Business rules

| Rule | Value |
|---|---:|
| Tax | 5% of item subtotal |
| Delivery fee | LKR 300 for delivery, zero for takeaway |
| Minimum item subtotal | LKR 500 |
| Item limits | 20 distinct items, 50 units per line |
| Unpaid card timeout | 15 minutes |
| COD maximum total | LKR 10,000 |
| COD failed-delivery strikes | 2 |
| Concurrent open COD orders | 2 |
| Card attempt limit | 3 declines |

These defaults are configurable in `backend/src/main/resources/application.properties`. The server calculates all amounts from frozen item prices. Items can be edited only while an order is `PLACED` and no payment method has been selected.

## Lifecycle

- Card: `PLACED → PAYMENT_VERIFIED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED → COMPLETED` for delivery, or `PREPARING → READY_FOR_PICKUP → COMPLETED` for takeaway.
- COD: `PLACED → CONFIRMED` with payment pending. The branch manager prepares and dispatches delivery to an approved rider from the same branch. Cash collection moves delivery from `OUT_FOR_DELIVERY` to `DELIVERED`, or takeaway from `READY_FOR_PICKUP` to `COMPLETED`, and verifies payment. `COMPLETED` always requires verified payment.
- Delivery can move from `OUT_FOR_DELIVERY` to terminal `DELIVERY_FAILED` with a reason. Cancellation is allowed before `PREPARING`; unpaid payment is voided and a verified card charge is refunded through the mock refund gateway.
- Each status change is recorded in `order_status_history`. Inventory is reserved synchronously at placement; mock after-commit listeners handle promotion reservation, inventory consumption/release, and cancellation/failure effects.

## API

Base path: `/api/orders`. Authenticated users send `Authorization: Bearer <JWT>`. Anonymous guests receive `guestToken` only in the placement response and send it as `X-Guest-Token` for that order. Store it privately. The browser keeps tokens in session storage by order ID. A guest order created before this token scheme requires support recovery; an order ID and phone number alone never grant access.

| Route | Purpose |
|---|---|
| `POST /` | Place order; signed-in customer identity comes from JWT, guests receive a private token |
| `GET /{id}`, `GET /{id}/bill`, `GET /{id}/history` | Read owned order, bill, and audit trail |
| `GET /?customerId=...` or `?branchId=...&status=...` | Scoped account or branch list |
| `PATCH /{id}/items/{itemId}` | Change quantity before payment |
| `GET /{id}/payment-options` | Card methods and COD eligibility or rejection reason |
| `POST /{id}/payment` | Select COD or simulate a credit/debit card charge; requires `Idempotency-Key` |
| `PUT /{id}/status` | Staff lifecycle transitions; dispatch includes `riderId` |
| `GET /riders` | Approved riders in the manager's branch |
| `POST /{id}/cod/collect` | Record `cashCollected`; server calculates `changeGiven` |
| `POST /{id}/delivery-failed` | Record allowed failure reason |
| `POST /{id}/cancel` | Void or refund before preparation |
| `POST /claim?orderId=...` | Link one guest order to a signed-in customer, using its guest token |
| `GET/POST /addresses` | Customer saved addresses |

Card body: `{ "method": "CREDIT_CARD", "success": true }` or `{ "method": "DEBIT_CARD", "success": false }`. COD body: `{ "method": "CASH_ON_DELIVERY" }`. Legacy `paymentMethod` and `CARD_STRIPE` remain accepted. Declines return 402 with `{error,message,order}`; other business errors use `{error,message}`. Repeating a payment key returns its saved first response without a second charge.

The mock card form never sends card number, expiry, or CVC to the backend. Payment and refund gateways are mocks; replace their implementations for a production payment integration.

## Data migration

Hibernate currently uses `ddl-auto=update` for the configured MySQL database. New columns and tables must exist before running `backend/db/order_module_v2_backfill.sql`. Back up the database and run the backfill on a local copy first. The script classifies legacy verified card orders, moves old COD states to the nearest supported state, initializes new numeric fields, and adds a single audit baseline for orders without history. It is idempotent but should be applied once as a controlled deployment step. Do not run it against the configured remote database during local development. A legacy cancelled order with a pending refund remains `REFUND_PENDING` for staff reconciliation; the backfill does not issue a refund. Roll back a deployment by restoring the backup and the previous application version.

Legacy guests have no stored nonce or token. Authorized branch staff and admins can still inspect those orders. Support must verify and recover ownership out of band; no phone/email-based self-claim route exists.

## Run and verify

```sh
cd backend && ./mvnw test
cd ../frontend && npm install && npm run build
```

Backend tests use H2. The frontend uses the Vite `/api` proxy for local development. Configure backend database and JWT settings through environment variables before starting the app. The mock menu and branch providers include branches 1 and 3 as open, with COD enabled; branch 2 is closed.
