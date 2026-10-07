# Order Module – Test Report

**Module:** Order & Billing (`backend/src/main/java/com/example/BigBite/order`)  
**Branch / commit:** `feature/order-management` @ `5cded8b`  
**Live run:** 2026-10-07 00:44:43 → 2026-10-07 00:46:37 (Asia/Colombo)  
**Database:** Aiven Cloud MySQL (the project's real database) via the running Spring Boot backend on `localhost:8080`

## Result

| Suite | What it covers | Result |
|---|---|---|
| **Live acceptance tests** (real server + real data) | 8 end-to-end scenarios, 74 checked steps | ✅ **74/74 passed** |
| Automated order-module tests (JUnit, H2) | Unit and HTTP integration tests for the order module | ✅ **73/73 passed** |
| Full backend suite (all modules) | Auth, branch, menu, order, integration | ✅ **138/138 passed** |

Every scenario below ran against the live backend using the real seeded branches, menu items and accounts. Prices, totals and status changes were read back from the server, not assumed.

## Test environment and data

| Item | Value |
|---|---|
| Branch under test | BigBite Colombo 03 (`CMB03`, open 24 hours, takeaway + cash on delivery enabled) |
| Closed branch used for negative test | BigBite Kandy (`KDY01`, hours 08:00–23:30, run was after midnight) |
| Menu items used | Margherita Pizza Rs. 1,850 · Classic Beef Burger Rs. 1,650 · Coca-Cola Rs. 300 (live menu table) |
| Accounts | `staff.cmb03`, `rider.cmb03`, `manager.cmb03`, `staff.kdy01`, `admin@bigbite.com`, plus two customers registered for this run |
| Test customer | `live.customer.9d11ca@example.com` (created by the run) |
| Payment gateway | Mock gateway with test cards: `4242…4242` approve, `4000…0002` decline, `…9995` insufficient funds, `…0069` expired |
| Business rules | 5% tax, Rs. 300 delivery fee, Rs. 500 minimum subtotal, 3 card attempts, COD for signed-in customers only |

## Scenario summary

| ID | Scenario | Steps | Result |
|---|---|---:|---|
| TC-01 | Real branch and menu data reach the order module | 5 | ✅ Pass |
| TC-02 | Guest takeaway with card: decline, approve, staff pipeline, sales | 16 | ✅ Pass |
| TC-03 | Customer delivery with cash on delivery, rider hand-over, review and complaint | 20 | ✅ Pass |
| TC-04 | Cancellation request after acceptance, approved by staff with refund | 8 | ✅ Pass |
| TC-05 | Declined cancellation request lets the kitchen continue | 7 | ✅ Pass |
| TC-06 | Staff rejects an incoming paid order | 5 | ✅ Pass |
| TC-07 | Three declined cards cancel the order | 5 | ✅ Pass |
| TC-08 | Role and access rules | 8 | ✅ Pass |

## Requirements covered

| Requirement | Verified in |
|---|---|
| Orders use real branch and menu data; closed branches and unknown items are refused | TC-01 |
| Server-side pricing: subtotal, 5% tax, Rs. 300 delivery fee, minimum Rs. 500 | TC-01, TC-02, TC-03 |
| Guest checkout with a private guest token | TC-02, TC-06, TC-08 |
| Card payment validated on the server; declines counted; 3 declines cancel the order | TC-02, TC-07 |
| Idempotent payments (same key never charges twice) | TC-02 |
| Cash on delivery: customers only, waits for staff acceptance, cash and change recorded | TC-02, TC-03 |
| Staff accept / reject incoming orders; rejection refunds the card | TC-02, TC-06 |
| Kitchen pipeline and dispatch to a branch rider with live tracking | TC-02, TC-03 |
| Item edits only before payment | TC-03 |
| Cancel before acceptance; cancel request after acceptance, approved (refund) or declined by staff | TC-04, TC-05, TC-08 |
| Completed orders feed the branch sales report | TC-02 |
| Reviews (once, 1–5) and complaints after hand-over | TC-03 |
| Role separation: staff run orders, manager read-only, riders only their orders, other customers/branches denied | TC-02, TC-03, TC-08 |
| Full audit trail of every status change | TC-02 |

## Detailed results

### TC-01 – Real branch and menu data reach the order module

_Orders are priced from the live menu table and blocked at branches that are closed._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Public branch directory | `GET /api/branches` | 200 | 200 | 3 branches, open now: BigBite Colombo 03 | ✅ |
| 2 | Public menu for Colombo 03 | `GET /api/menu/branch/1?availableOnly=true` | 200 | 200 | 10 available items, e.g. Margherita Pizza Rs. 1850.0 | ✅ |
| 3 | Order at a closed branch (Kandy, outside 08:00–23:30) is refused | `POST /api/orders` | 400 | 400 | VALIDATION_ERROR: Branch 2 does not exist or is currently closed | ✅ |
| 4 | Unknown menu item is refused | `POST /api/orders` | 400 | 400 | VALIDATION_ERROR: Menu item 999999 is not available | ✅ |
| 5 | Subtotal under Rs. 500 is refused | `POST /api/orders` | 400 | 400 | VALIDATION_ERROR: Minimum order subtotal is LKR 500.00. Your current subtotal is LKR 300.00 | ✅ |

### TC-02 – Guest takeaway with card: decline, approve, staff pipeline, sales

_A guest pays by card (one decline first), staff accept and complete, and the sale reaches the branch report._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Guest places takeaway order (2 × Margherita) | `POST /api/orders` | 201 | 201 | grandTotal=3885.0 (2×1850.0 + 5% tax), guest token issued | ✅ |
| 2 | Reading the order without the guest token is denied | `GET /api/orders/26` | 401 | 401 | AUTH_REQUIRED: Authentication or a valid guest token is required | ✅ |
| 3 | Payment options: cash not offered to guests | `GET /api/orders/26/payment-options` | 200 | 200 | codEligible=false (COD_LOGIN_REQUIRED) | ✅ |
| 4 | Card failing the Luhn check is rejected without using an attempt | `POST /api/orders/26/payment` | 422 | 422 | INVALID_CARD_DETAILS: Card number is not valid | ✅ |
| 5 | Declined test card returns 402 with attempts remaining | `POST /api/orders/26/payment` | 402 | 402 | CARD_DECLINED, attemptsRemaining=2 | ✅ |
| 6 | Approved test card verifies payment; order waits for staff | `POST /api/orders/26/payment` | 200 | 200 | status=PAYMENT_VERIFIED, awaitingAcceptance=true, card ****4242 | ✅ |
| 7 | Repeating the same Idempotency-Key replays the result (no second charge) | `POST /api/orders/26/payment` | 200 | 200 | same response replayed | ✅ |
| 8 | Branch manager cannot accept orders | `POST /api/orders/26/accept` | 403 | 403 | STAFF_REQUIRED: Only branch staff of this order's branch can do this | ✅ |
| 9 | Staff from another branch cannot accept | `POST /api/orders/26/accept` | 403 | 403 | STAFF_REQUIRED: Only branch staff of this order's branch can do this | ✅ |
| 10 | Kitchen cannot start before acceptance | `PUT /api/orders/26/status` | 409 | 409 | INVALID_TRANSITION: Cannot move order from PAYMENT_VERIFIED to PREPARING | ✅ |
| 11 | Staff accepts | `POST /api/orders/26/accept` | 200 | 200 | status=CONFIRMED | ✅ |
| 12 | Staff moves order to PREPARING | `PUT /api/orders/26/status` | 200 | 200 | status=PREPARING | ✅ |
| 13 | Staff moves order to READY_FOR_PICKUP | `PUT /api/orders/26/status` | 200 | 200 | status=READY_FOR_PICKUP | ✅ |
| 14 | Staff moves order to COMPLETED | `PUT /api/orders/26/status` | 200 | 200 | status=COMPLETED | ✅ |
| 15 | Audit trail has every step | `GET /api/orders/26/history` | 200 | 200 | PLACED → PAYMENT_VERIFIED → CONFIRMED → PREPARING → READY_FOR_PICKUP → COMPLETED | ✅ |
| 16 | Completed order is recorded in the branch sales report | `GET /api/manager/branch/reports/monthly` | 200 | 200 | orders 1 → 2, revenue Rs. 930.0 → Rs. 4815.0 | ✅ |

### TC-03 – Customer delivery with cash on delivery, rider hand-over, review and complaint

_COD waits for staff acceptance, a rider is dispatched and tracked, cash and change are recorded, feedback works._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Customer places delivery order (burger + pizza) | `POST /api/orders` | 201 | 201 | grandTotal=3975.0 incl. Rs. 300 delivery | ✅ |
| 2 | Customer edits a quantity before paying | `PATCH /api/orders/27/items/36` | 200 | 200 | grandTotal 3975.0 → 5707.5 | ✅ |
| 3 | Another customer cannot read this order | `GET /api/orders/27` | 403 | 403 | ACCESS_DENIED: You do not have access to this order | ✅ |
| 4 | Customer chooses cash on delivery | `POST /api/orders/27/payment` | 200 | 200 | status=PLACED, awaitingAcceptance=true, paymentStatus=PENDING | ✅ |
| 5 | Items are locked once payment is chosen | `PATCH /api/orders/27/items/36` | 409 | 409 | ORDER_ITEMS_LOCKED: Order items can only be edited before payment is selected | ✅ |
| 6 | Staff accepts | `POST /api/orders/27/accept` | 200 | 200 | status=CONFIRMED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=5707.5 | ✅ |
| 7 | Staff starts preparing | `PUT /api/orders/27/status` | 200 | 200 | status=PREPARING, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=5707.5 | ✅ |
| 8 | Staff lists branch riders with availability | `GET /api/orders/riders` | 200 | 200 | Rider Colombo (free) | ✅ |
| 9 | Dispatch without a rider is refused | `PUT /api/orders/27/status` | 400 | 400 | RIDER_REQUIRED: Choose a rider before dispatch | ✅ |
| 10 | Staff dispatches to the rider | `PUT /api/orders/27/status` | 200 | 200 | rider=Rider Colombo | ✅ |
| 11 | Customer sees live tracking | `GET /api/orders/27/tracking` | 200 | 200 | stage=PICKED_UP, eta=24 min, rider=Rider Colombo | ✅ |
| 12 | COD order cannot be completed before cash is collected | `PUT /api/orders/27/status` | 409 | 409 | INVALID_TRANSITION: Cannot move order from OUT_FOR_DELIVERY to COMPLETED | ✅ |
| 13 | Rider cannot record less cash than the total | `POST /api/orders/27/cod/collect` | 422 | 422 | INSUFFICIENT_CASH: Cash received must cover the order total | ✅ |
| 14 | Rider records Rs. 6000 cash; change is calculated | `POST /api/orders/27/cod/collect` | 200 | 200 | status=DELIVERED, paymentStatus=VERIFIED, change Rs. 292.5 | ✅ |
| 15 | Rider completes the order | `PUT /api/orders/27/status` | 200 | 200 | status=COMPLETED, paymentStatus=VERIFIED, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=5707.5, changeGiven=292.5 | ✅ |
| 16 | Rating outside 1–5 is rejected | `POST /api/orders/27/review` | 400 | 400 | VALIDATION_ERROR: Rating must be 1 to 5 | ✅ |
| 17 | Customer reviews the order | `POST /api/orders/27/review` | 201 | 201 | rating=5 | ✅ |
| 18 | A second review is refused | `POST /api/orders/27/review` | 409 | 409 | ALREADY_REVIEWED: This order has already been reviewed | ✅ |
| 19 | Customer files a complaint | `POST /api/orders/27/complaints` | 201 | 201 | status=OPEN | ✅ |
| 20 | Manager sees the complaint (read-only) | `GET /api/orders/complaints` | 200 | 200 | complaint listed for the branch | ✅ |

### TC-04 – Cancellation request after acceptance, approved by staff with refund

_Once the kitchen has accepted, the customer must ask; staff approval cancels and refunds the card._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Customer places takeaway order | `POST /api/orders` | 201 | 201 | status=PLACED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1732.5 | ✅ |
| 2 | Customer pays by debit card | `POST /api/orders/28/payment` | 200 | 200 | status=PAYMENT_VERIFIED, paymentStatus=VERIFIED, awaitingAcceptance=True, refundStatus=NOT_APPLICABLE, grandTotal=1732.5, cardLast4=4242 | ✅ |
| 3 | Staff accepts | `POST /api/orders/28/accept` | 200 | 200 | status=CONFIRMED, paymentStatus=VERIFIED, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1732.5, cardLast4=4242 | ✅ |
| 4 | Direct cancel is no longer allowed | `POST /api/orders/28/cancel` | 409 | 409 | CANCEL_REQUEST_REQUIRED: The branch has already accepted this order. Send a cancellation request instead. | ✅ |
| 5 | Customer requests cancellation | `POST /api/orders/28/cancel-request` | 200 | 200 | cancelRequestStatus=PENDING | ✅ |
| 6 | Kitchen is blocked while the request is pending | `PUT /api/orders/28/status` | 409 | 409 | CANCEL_REQUEST_PENDING: Resolve the customer's cancellation request before moving this order | ✅ |
| 7 | Request appears in the staff queue | `GET /api/orders/cancel-requests` | 200 | 200 | listed | ✅ |
| 8 | Staff approves; order cancelled and refunded | `POST /api/orders/28/cancel-request/approve` | 200 | 200 | status=CANCELLED, paymentStatus=REFUNDED, refundStatus=PROCESSED | ✅ |

### TC-05 – Declined cancellation request lets the kitchen continue

_Staff can decline a late cancellation with a note; the order then proceeds normally._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Customer places takeaway order | `POST /api/orders` | 201 | 201 | status=PLACED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5 | ✅ |
| 2 | Customer pays by card | `POST /api/orders/29/payment` | 200 | 200 | status=PAYMENT_VERIFIED, paymentStatus=VERIFIED, awaitingAcceptance=True, refundStatus=NOT_APPLICABLE, grandTotal=1942.5, cardLast4=4242 | ✅ |
| 3 | Staff accepts | `POST /api/orders/29/accept` | 200 | 200 | status=CONFIRMED, paymentStatus=VERIFIED, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5, cardLast4=4242 | ✅ |
| 4 | Customer requests cancellation | `POST /api/orders/29/cancel-request` | 200 | 200 | status=CONFIRMED, paymentStatus=VERIFIED, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5, cancelRequestStatus=PENDING | ✅ |
| 5 | Staff declines with a note | `POST /api/orders/29/cancel-request/decline` | 200 | 200 | cancelRequestStatus=DECLINED | ✅ |
| 6 | Kitchen continues | `PUT /api/orders/29/status` | 200 | 200 | status=PREPARING | ✅ |
| 7 | A second request is refused | `POST /api/orders/29/cancel-request` | 409 | 409 | CANCEL_REQUEST_EXISTS: A cancellation request for this order was already decided | ✅ |

### TC-06 – Staff rejects an incoming paid order

_Rejection needs a reason and refunds the card automatically._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Guest places takeaway order | `POST /api/orders` | 201 | 201 | status=PLACED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5 | ✅ |
| 2 | Guest pays by card | `POST /api/orders/30/payment` | 200 | 200 | status=PAYMENT_VERIFIED, paymentStatus=VERIFIED, awaitingAcceptance=True, refundStatus=NOT_APPLICABLE, grandTotal=1942.5, cardLast4=4242 | ✅ |
| 3 | Rejection without a reason is refused | `POST /api/orders/30/reject` | 400 | 400 | VALIDATION_ERROR: Please give a reason | ✅ |
| 4 | Staff rejects: kitchen closing | `POST /api/orders/30/reject` | 200 | 200 | status=CANCELLED, paymentStatus=REFUNDED, reason=REJECTED_BY_BRANCH | ✅ |
| 5 | Guest can still read the outcome with their token | `GET /api/orders/30` | 200 | 200 | status=CANCELLED | ✅ |

### TC-07 – Three declined cards cancel the order

_The payment attempt limit voids the order after the third decline._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Customer places takeaway order | `POST /api/orders` | 201 | 201 | status=PLACED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5 | ✅ |
| 2 | Decline #1 (0002) | `POST /api/orders/31/payment` | 402 | 402 | PAYMENT_DECLINED / CARD_DECLINED, attemptsRemaining=2 | ✅ |
| 3 | Decline #2 (9995) | `POST /api/orders/31/payment` | 402 | 402 | PAYMENT_DECLINED / INSUFFICIENT_FUNDS, attemptsRemaining=1 | ✅ |
| 4 | Decline #3 (0069) | `POST /api/orders/31/payment` | 402 | 402 | PAYMENT_FAILED / EXPIRED_CARD, attemptsRemaining=0 | ✅ |
| 5 | Order is cancelled with payment voided | `GET /api/orders/31` | 200 | 200 | status=CANCELLED, paymentStatus=VOIDED, reason=PAYMENT_FAILED | ✅ |

### TC-08 – Role and access rules

_Only the right people can see or move an order._

| # | Step | Request | Expected | Actual | Observed | Result |
|---:|---|---|:---:|:---:|---|:---:|
| 1 | Guest places takeaway order | `POST /api/orders` | 201 | 201 | status=PLACED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5 | ✅ |
| 2 | Listing orders anonymously is denied | `GET /api/orders` | 401 | 401 | AUTH_REQUIRED: Authentication is required | ✅ |
| 3 | Wrong guest token is denied | `GET /api/orders/32` | 401 | 401 | AUTH_REQUIRED: Authentication or a valid guest token is required | ✅ |
| 4 | Staff/admin accounts cannot place customer orders | `POST /api/orders` | 403 | 403 | CUSTOMER_REQUIRED: Only customers can place personal orders | ✅ |
| 5 | Rider not assigned to the order cannot see it | `GET /api/orders/32` | 403 | 403 | ACCESS_DENIED: You do not have access to this order | ✅ |
| 6 | Branch manager can view it (read-only) | `GET /api/orders/32` | 200 | 200 | status=PLACED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5 | ✅ |
| 7 | Super Admin can view it | `GET /api/orders/32` | 200 | 200 | status=PLACED, paymentStatus=PENDING, awaitingAcceptance=False, refundStatus=NOT_APPLICABLE, grandTotal=1942.5 | ✅ |
| 8 | Guest cancels before acceptance (nothing charged) | `POST /api/orders/32/cancel` | 200 | 200 | status=CANCELLED, paymentStatus=VOIDED | ✅ |

## Automated test suite (order module)

| Test class | Tests | Covers | Result |
|---|---:|---|:---:|
| `OrderServiceTest` | 29 | Pricing, promo, phone rules, item limits and edits, payments, idempotency, COD, cancellation, refunds, hand-over | ✅ |
| `OrderHttpSecurityTest` | 7 | Guest tokens, role access, COD delivery and counter flows, card delivery, manager read-only | ✅ |
| `OrderLifecycleHttpTest` | 7 | Accept/reject, cancel requests, refund retry, invalid and declined cards, acceptance timeout, reviews and complaints | ✅ |
| `CardPaymentTest` | 9 | Luhn, expiry and CVC checks, card brands, gateway test-card table, card data never printed | ✅ |
| `OrderTransitionGuardTest` | 7 | State machine rules, STAFF-only kitchen actions, pending cancel request blocks the kitchen | ✅ |
| `OrderRateLimiterTest` | 4 | Order placement rate limiting | ✅ |
| `CodEligibilityServiceTest` | 3 | Cash on delivery eligibility rules | ✅ |
| `OrderMigrationTest` | 2 | Legacy data backfill and payment-timeout query | ✅ |
| `GuestTokenServiceTest` | 2 | Guest token signing and verification | ✅ |
| `OrderConcurrencyTest` | 1 | Optimistic locking prevents stale overwrites | ✅ |
| `OrderEventListenerTest` | 1 | Inventory/promotion side effects only after commit | ✅ |
| `OrderSalesRecorderTest` | 1 | Completed order recorded once in branch sales | ✅ |
| **Total** | **73** | | ✅ |

## Observations

- **Response times:** average 1416 ms per request (requests that reach the database took roughly 0.6–2.5 s, longest 3.3 s; requests rejected before the database answered in under 0.3 s). Nearly all of this is the network round trip to the Aiven cloud database. In-memory tests of the same logic run in milliseconds.
- **Mocked neighbours:** payment and refund gateways, inventory, promotions, delivery tracking, reviews and complaints are mock implementations behind interfaces (`order/external`, with the mocks in `order/external/mock`) until those modules are built. Reviews and complaints are kept in memory and reset when the server restarts.
- **Data left behind:** the run created two test customers and seven orders at BigBite Colombo 03 (two completed, the others cancelled or rejected, plus one still preparing from TC-05). They appear in the branch's history and sales report.

## How to re-run

```bash
cd backend && ./mvnw test
```

With the backend running against the database:

```bash
python3 backend/api-tests/live_order_tests.py
```

`backend/api-tests/bigbite.http` contains the same flow as individual requests for the VS Code REST Client or IntelliJ HTTP Client.
