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
| Staff acceptance timeout | 10 minutes (then auto-rejected and refunded) |
| Refund retries | up to 5, every 5 minutes, plus manual retry by staff |
| Complaint window | 48 hours after delivery or collection |

These defaults are configurable in `backend/src/main/resources/application.properties`. The server calculates all amounts from frozen item prices. Items can be edited only while an order is `PLACED` and no payment method has been selected.

## Roles

| Role | Order responsibilities |
|---|---|
| Customer / guest | Place, pay, edit items before payment, cancel before acceptance, request cancellation after acceptance, review, complain |
| `STAFF` (branch) | Accept or reject, kitchen pipeline, dispatch to a rider, counter cash, approve/decline cancel requests, retry refunds |
| `DELIVERY_PARTNER` | Mark delivered, collect delivery cash, report a failed delivery (assigned orders only) |
| `BRANCH_MANAGER` | Read-only view of the branch's orders, complaints and reviews |
| `SUPER_ADMIN` | View everything and force a cancellation |

## Lifecycle

- **Card:** `PLACED → PAYMENT_VERIFIED` (awaiting acceptance) `→ CONFIRMED → PREPARING`. Delivery continues `→ OUT_FOR_DELIVERY → DELIVERED → COMPLETED`; takeaway continues `→ READY_FOR_PICKUP → COMPLETED`.
- **COD:** the order stays `PLACED` with `paymentMethod=CASH_ON_DELIVERY` (awaiting acceptance) until staff accept it `→ CONFIRMED`. Cash collection moves delivery from `OUT_FOR_DELIVERY` to `DELIVERED`, or takeaway from `READY_FOR_PICKUP` to `COMPLETED`, and verifies payment. `COMPLETED` always requires verified payment.
- **Acceptance:** staff `accept` or `reject` (with a reason; paid orders are refunded). Orders nobody accepts within the timeout are rejected automatically.
- **Cancellation:** customers cancel directly while the order awaits payment or acceptance. From `CONFIRMED` or `PREPARING` they send a cancel request; staff approve (cancel and refund) or decline (with a note). A pending request blocks further kitchen transitions.
- **Refunds:** a failed refund leaves the order `REFUND_PENDING`; a scheduled job and the staff "retry refund" action try again.
- **Failure:** `OUT_FOR_DELIVERY → DELIVERY_FAILED` with a reason; inventory records the waste.
- Every change is recorded in `order_status_history`. After-commit listeners notify the inventory, promotion and delivery ports, and every `COMPLETED` order is recorded as a `BranchSale` for the branch reports.

## Connections to other modules

Real modules: branches and menu items are read from the branch and menu tables (`JpaBranchLookupService`, `JpaMenuLookupService`).
Mocked until those modules exist (`order/external/Mock*`): payment gateway, refund gateway, inventory, promotions (`WELCOME10`), delivery (rider availability and simulated tracking), reviews and complaints (in memory).

## API

Base path: `/api/orders`. Authenticated users send `Authorization: Bearer <JWT>`. Anonymous guests receive `guestToken` only in the placement response and send it as `X-Guest-Token` for that order.

| Route | Who | Purpose |
|---|---|---|
| `POST /` | customer, guest | Place order |
| `GET /{id}`, `/{id}/bill`, `/{id}/history`, `/{id}/tracking` | viewer | Order, bill, audit trail, live delivery tracking |
| `GET /?status=` | scoped | Customer's own orders, or the caller's branch for staff/manager/rider |
| `PATCH /{id}/items/{itemId}` | owner | Change quantity before payment |
| `GET /{id}/payment-options` | owner | Card methods and COD eligibility |
| `POST /{id}/payment` | owner | Card or COD; requires `Idempotency-Key` |
| `POST /{id}/accept`, `POST /{id}/reject` | staff | Accept or reject an incoming order |
| `PUT /{id}/status` | staff, rider | Kitchen and delivery transitions; dispatch includes `riderId` |
| `GET /riders` | staff | Riders of the branch with busy/free state |
| `POST /{id}/cod/collect` | staff, rider | Record `cashCollected`; the server calculates change |
| `POST /{id}/delivery-failed` | staff, rider | Record a failure reason |
| `POST /{id}/cancel` | owner, staff, admin | Cancel (owners only before acceptance) |
| `POST /{id}/cancel-request` | owner | Ask the branch to cancel after acceptance |
| `POST /{id}/cancel-request/approve`, `/decline` | staff | Decide a cancel request |
| `POST /{id}/refund/retry` | staff | Retry a pending refund |
| `GET /cancel-requests`, `/refunds`, `/complaints`, `/reviews` | staff, manager | Branch queues |
| `GET /{id}/feedback`, `POST /{id}/review`, `POST /{id}/complaints` | owner | Reviews and complaints |
| `POST /claim?orderId=` | customer | Link a guest order using its guest token |
| `GET/POST /addresses` | customer | Saved addresses |

Card body: `{"method":"CREDIT_CARD","card":{"holderName":"…","number":"4242424242424242","expMonth":12,"expYear":2030,"cvc":"123"}}`. COD body: `{"method":"CASH_ON_DELIVERY"}`. The server validates the card (Luhn, expiry, CVC; `422 INVALID_CARD_DETAILS`, no attempt used), and the mock gateway decides by number:

| Card | Result |
|---|---|
| 4242 4242 4242 4242 | approved |
| 4000 0000 0000 0002 | declined |
| 4000 0000 0000 9995 | insufficient funds |
| 4000 0000 0000 0069 | expired card |
| 4000 0000 0000 0127 | incorrect CVC |

Declines return `402 {error, declineCode, message, attemptsRemaining, order}`. Only the brand and last four digits are stored. Repeating a payment key returns the first response without a second charge. All other errors use `{timestamp, status, error, message, errors?}`.

## Data migration

Hibernate currently uses `ddl-auto=update` for the configured MySQL database. New columns and tables must exist before running `backend/db/order_module_v2_backfill.sql`. Back up the database and run the backfill on a local copy first. The script classifies legacy verified card orders, moves old COD states to the nearest supported state, initializes new numeric fields, and adds a single audit baseline for orders without history. It is idempotent but should be applied once as a controlled deployment step. Do not run it against the configured remote database during local development. A legacy cancelled order with a pending refund remains `REFUND_PENDING` for staff reconciliation; the backfill does not issue a refund. Roll back a deployment by restoring the backup and the previous application version.

Legacy guests have no stored nonce or token. Authorized branch staff and admins can still inspect those orders. Support must verify and recover ownership out of band; no phone/email-based self-claim route exists.

## Run and verify

```sh
cd backend && ./mvnw test
cd ../frontend && npm install && npm run build
```

Backend tests use H2. `backend/api-tests/bigbite.http` walks the whole flow against a running server.
