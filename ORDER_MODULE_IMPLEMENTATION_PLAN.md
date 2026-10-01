# BigBite Order & Billing Module — End-to-End Build Plan

## Goal and source of truth

Build the complete order and billing workflow described in the attached Desktop `ORDER_MODULE_README.md`, using this repository's existing Spring Boot and React application as the starting point. The attached document controls the business rules where older repository documentation or code differs: 5% tax, LKR 300 delivery fee, LKR 500 minimum subtotal, 20 distinct items, 50 units per line, 15-minute card payment timeout, and LKR 10,000 COD limit. Payment and refund gateways remain mocks. Existing orders and clients must continue to work wherever that does not undermine the new guest access rule.

The user resolved four gaps in the specification: guest checkout uses a private access token; old guest orders without a token require support recovery; a branch manager assigns a rider at dispatch; and order items may be edited only before payment. Preserve guest checkout and distinguish its security rule from customer account ownership.

## Phase 1 — Data and compatibility

1. Add `DELIVERY_FAILED`; card methods `CREDIT_CARD` and `DEBIT_CARD` while accepting legacy `CARD_STRIPE`; payment states `VOIDED`, `REFUND_PENDING`, `REFUNDED`; and fields for gateway reference, payment attempts, cash, change, refunded amount, rider and delivery timestamps, cancellation/failure reasons, and a guest access nonce. Keep `@Version`, existing snapshots, and order creation idempotency.
2. Add `order_status_history` for the initial `PLACED` entry and every subsequent transition, and a payment attempt ledger with a unique idempotency key and stored outcome. The ledger allows retries of any earlier attempt without a second charge. Store no raw guest token: derive it from a random per-order nonce and a server secret. Return the token only on guest placement; the browser retains it for that order.
3. Add a repeatable local MySQL data backfill after Hibernate creates new columns and tables, and verify equivalent legacy states in H2 tests. Backfill verified legacy orders without a method as `CREDIT_CARD`, preserve their financial amounts, and classify legacy COD records while retaining their existing history. Deploy only after a database backup; do not run migration against the configured remote database as part of this build. Document the backfill and rollback procedure.
4. Keep current order creation, read, bill, list, payment, cancellation, item edit, address, and claim routes where feasible. Normalize their authorization and errors. Legacy guest orders remain stored and visible to authorized branch staff/admin; guest self-service recovery is deferred to support because they have no private token.

## Phase 2 — Backend behavior and security

1. Move ownership and branch checks into an `OrderAccessGuard` called by every read and mutation. Authenticated customers access only their orders; guests present `X-Guest-Token` for their order; managers access their assigned branch; riders access only assigned deliveries; admins have system access. A guest token grants only that order's customer actions. Permit per-order guest routes only when the guard validates a token. Reject missing identity with 401 and wrong scope with 403. Guest claim requires the order token and an authenticated customer; a match on phone/email alone is insufficient.
2. Centralize transitions in `OrderTransitionGuard` and one transactional service method. The supported card path is `PLACED → PAYMENT_VERIFIED → CONFIRMED → PREPARING → ...`; COD selection is `PLACED → CONFIRMED` with payment `PENDING`. Delivery and takeaway then follow the document's separate paths. Only `/payment` creates `PAYMENT_VERIFIED`; only `/cod/collect` verifies COD cash. Completion requires `paymentStatus = VERIFIED`. Invalid or concurrent transitions return 409. Each actual change records actor, note, and timestamp in history.
3. Add `GET /{id}/payment-options`, `POST /{id}/cod/collect`, `POST /{id}/delivery-failed`, and `GET /{id}/history`. Require `Idempotency-Key` on payment attempts. Accept `method` while tolerating the legacy `paymentMethod` request field and `CARD_STRIPE` value. A declined card attempt persists `FAILED` and its attempt count while responding 402; the third decline cancels with `PAYMENT_FAILED`. A duplicate key returns the recorded result. Charge/collect only the database grand total.
4. Implement COD eligibility in one service and use it for both the options endpoint and payment. Apply logged-in-only, branch acceptance, LKR 10,000 total, two failed deliveries, and two open COD orders. `collectCod` checks the assigned rider or branch manager, validates cash against total, computes change, and atomically moves delivery to `DELIVERED` or takeaway to `COMPLETED`. A manager chooses an active rider assigned to the same branch when dispatching; `riderId` is recorded with `dispatchedAt`.
5. Cancellation before `PREPARING` voids unpaid orders or requests and records a mock refund for verified card orders. Persist the final payment state and refunded amount; capture a reason. Delivery failure from `OUT_FOR_DELIVERY` requires one of the specified reasons and marks COD payment failed without refunding card orders. The timeout job cancels only unpaid, unselected card orders older than 15 minutes and explicitly excludes COD.
6. Keep item editing available only while the order is `PLACED` and no payment attempt has succeeded or selected COD. Recalculate on the server from frozen item prices; never silently change the total of a paid order. Recheck minimum subtotal after edits. Validate quantities and preserve creation idempotency.
7. Replace direct mock side effects with branch/menu/promotion/inventory interfaces from the document. Reserve inventory synchronously at placement; consume/release inventory and reserve/release promotions through events delivered after commit. Add mock gateway and refund interfaces. Use configuration properties for all business numbers, with the document's defaults.

## Phase 3 — Frontend

1. Update types and `orderApi` for new statuses, payment options, payment attempt keys, COD collection, delivery failure, status history, guest token, and structured errors. Keep guest tokens per order in browser session storage and send them only for that order. Allow public branch/menu/cart/checkout/payment/status routes for guests while account history and saved addresses remain authenticated.
2. Have payment UI use server payment options and show COD ineligibility reasons. Display credit/debit card simulation clearly. Reuse an idempotency key when retrying the same request; generate a new one for a new card attempt. Show cash due until staff collection, and show refund and delivery failure states.
3. Update status stepper and customer order pages for the four card/COD and delivery/takeaway paths. Hide item editing after payment selection and cancellation after `PREPARING`. Include status history. Handle 401/403/402/409/422 with actionable messages.
4. Update manager and rider queues to use role-appropriate actions. The manager selects a same-branch rider for dispatch; the assigned rider sees the order and can collect COD or report failed delivery. Provide a cash input/change display for delivery and counter collection. Remove the legacy COD `PAYMENT_VERIFIED` and direct-complete UI actions.

## Phase 4 — Verification and delivery

1. Unit-test all state transitions and forbidden transitions, payment/COD eligibility, calculations and rounding, repeated payment keys, third card failure, refund/void behavior, guest token authorization, role/branch/rider scope, timeout exclusion, and event publishing.
2. Add HTTP integration tests with H2 and Spring Security for endpoint statuses and response shapes, including anonymous access denial, guest token access, manager cross-branch denial, and assigned-rider enforcement. Test migration/backfill on representative legacy rows.
3. Run backend tests and frontend build. Exercise card delivery, COD delivery, COD takeaway, cancellation/refund, failed delivery, timeout, and security scenarios end to end against a local/test database. Confirm no application data or secrets are committed.
4. Update the repository's order README, project overview, API examples, run/setup instructions, and migration notes to match the implemented behavior. Treat the module as complete only when every required checklist item and documented scenario has evidence from code and tests or an observed local run.

## API and compatibility decisions

| Interface | Decision |
|---|---|
| `POST /api/orders` | Existing body plus guest token in guest-only response; logged-in identity comes from JWT. Duplicate creation key returns its original order only to the same principal or holder of the guest token. |
| Guest requests | `X-Guest-Token` plus order ID for reads, bill, payment, cancellation, and status history. Never accept phone alone as authorization for new orders. |
| `POST /{id}/payment` | Require `Idempotency-Key`; canonical body is `method`, with legacy `paymentMethod` accepted. `CARD_STRIPE` remains a legacy alias for credit card. |
| `PUT /{id}/status` | Actor, branch, payment, fulfillment, and rider rules enforced on the server. Dispatch includes `riderId` chosen by the manager. |
| `POST /{id}/cod/collect` | Body contains `cashCollected`; server returns updated order/bill including `changeGiven`. |
| `POST /{id}/delivery-failed` | Body contains `reason`; only assigned rider or same-branch manager may submit. |
| Errors | Stable `{ error, message }` shape; codes accompany 402/409/422 results. Existing fields may remain for old clients. |

## Acceptance criteria

The module is done when the 15-item refactor checklist in the attached specification is implemented; all four documented customer/staff journeys and the guard demonstrations work; preexisting orders remain readable and processable; authenticated and guest access follows the agreed policy; no flow reaches `COMPLETED` without verified payment; COD never times out while awaiting cash; and backend tests plus frontend build pass.

## Implementation record — 2026-09-30

The 15 refactor items have corresponding code in `backend/src/main/java/com/example/BigBite/order` and the frontend order pages. HTTP tests cover guest card access, card delivery, COD delivery, COD takeaway, paid cancellation/refund, branch scope, and customer ownership. Unit and integration tests cover payment retries, the third decline, state guards, COD eligibility, delivery failure, concurrency, timeout exclusion, after-commit events, and repeatable legacy backfill. The current verification run passed 70 backend tests, the frontend production build, and `git diff --check`.

The MySQL backfill is supplied as `backend/db/order_module_v2_backfill.sql`. It was tested with equivalent H2 statements and has not been run against the configured remote database. Applying it belongs to a backed-up deployment, with legacy pending refunds reconciled by support.
