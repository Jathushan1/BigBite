# Order Module – Viva Guide

Everything for the order module viva in one place: what to demo, where the code is, what to say, and how to handle live changes.
Paths are relative to `backend/src/main/java/com/example/BigBite/` (backend) and `frontend/src/` (frontend). Line numbers refer to `main` @ `3c2ad58`.

**Before the viva**

```bash
cd backend && ./mvnw spring-boot:run      # terminal 1 – http://localhost:8080
cd frontend && npm run dev                # terminal 2 – http://localhost:3000
```

Open three windows (normal, private, and a second browser) so customer, staff and manager can stay signed in at the same time.

| Role | Email | Password |
|---|---|---|
| Customer | customer@bigbite.lk | Customer@123 |
| Staff (Colombo 03) | staff.cmb03@bigbite.lk | Staff@123 |
| Rider (Colombo 03) | rider.cmb03@bigbite.lk | Rider@123 |
| Manager (Colombo 03) | manager.cmb03@bigbite.lk | Manager@123 |
| Super Admin | admin@bigbite.com | Admin@123 |

Test cards: `4242 4242 4242 4242` approves; `4000 0000 0000 0002` declines (any future expiry, any CVC). Always order from **BigBite Colombo 03**, which is open 24 hours.

---

## 1. CRUD on orders – UI demonstration

An order is never physically deleted. It is a financial record, so "Delete" means **cancel** (a soft delete that keeps the row for audit, refunds and reports).

| CRUD | What to show in the UI | Who | Endpoint |
|---|---|---|---|
| **Create** | Customer: Order Now → Colombo 03 → add 2 items → Cart → Checkout (details prefilled from profile) → Place Order | Customer or guest | `POST /api/orders` |
| **Read (one)** | Order tracking page `/order/{id}`: status stepper, items, bill, timeline, rider tracker | Owner, staff, manager, admin | `GET /api/orders/{id}`, `/bill`, `/history`, `/tracking` |
| **Read (list)** | Customer: My Orders · Staff: Command Center board · Manager: Live Orders (read-only) | Scoped by role | `GET /api/orders` |
| **Update (items)** | On the order page **before paying**: use +/− on a line, and the total recalculates | Owner | `PATCH /api/orders/{id}/items/{itemId}` |
| **Update (payment)** | Payment page: Card (decline with `…0002`, then approve with `4242…`) or Cash | Owner | `POST /api/orders/{id}/payment` |
| **Update (status)** | Staff board: **Accept** → **Start preparing** → **Dispatch** (choose rider) or **Ready for pickup** → Rider: **Mark delivered** / **Record cash** → **Complete**. You can also drag a card to the next column. | Staff, rider | `POST /{id}/accept`, `PUT /{id}/status`, `POST /{id}/cod/collect` |
| **Delete (cancel)** | Before the branch accepts: customer clicks **Cancel order** (card refunded automatically). After acceptance: **Request cancellation** → staff **Approve** (refund) or **Decline**. Staff can also **Reject** an incoming order. | Customer, staff, admin | `POST /{id}/cancel`, `/cancel-request`, `/cancel-request/approve`, `/reject` |

**Suggested 5-minute demo script**
1. Customer orders a delivery at Colombo 03 → pays with `4000…0002` (declined, "2 attempts left") → pays with `4242…` → page shows *Waiting for the branch to accept*.
2. Staff window: a chime plays → **Accept** → **Start preparing** → **Dispatch** → choose *Rider Colombo*.
3. Customer window: the rider tracker bar moves.
4. Rider window: **Mark delivered** → **Complete**.
5. Customer: leave a 5-star review. Manager: the order is in the read-only board and the sale appears in the sales chart.
6. Second order: customer pays → staff accepts → customer **Request cancellation** → staff **Approve** → order shows *Cancelled · Refunded*.

---

## 2. Where each CRUD lives in the code

Every request follows the same path: **Controller → AccessGuard → Service → TransitionGuard → Repository → Events**.

| CRUD | Controller (`order/controller/OrderController.java`) | Service (`order/service/OrderService.java`) | Repository |
|---|---|---|---|
| Create | `placeOrder` – `@PostMapping` line 86 | `placeOrderFor` (180) → `placeOrder` (356) | `orderRepository.save` |
| Read one | `getOrder` – `@GetMapping("/{id}")` 118 | `getOrderFor` (175) → `getOrderById` (572) | `findById` |
| Read list | `getOrders` – `@GetMapping` 129 | `getOrdersFor` (204) → `getOrders` (578) | `findByCustomerIdOrderByCreatedAtDesc`, `findByBranchIdOrderByCreatedAtDesc` |
| Update items | `updateOrderItem` – `@PatchMapping` 308 | `updateOrderItem` (793) | `save` |
| Update payment | `recordPayment` – 332 | `recordPayment` (922) | `findByIdForUpdate` (row lock) |
| Update status | `updateStatus` 196, `acceptOrder` 208 | `updateOrderStatus` (598) → `transition` (636) | `save` + `OrderStatusHistoryRepository.save` |
| Cancel | `cancelOrder` 295, `rejectOrder` 215, cancel-request 223–242 | `cancelOrder` (654), `rejectOrder` (679), `requestCancellation` (692), `resolveCancellation` (720) → `cancelWithRefund` (742) | `save` |

Key ideas to point at:
- **`transition()` (line 636)** is the only place an order's status changes. It saves the order, writes a history row and publishes an event. That makes every change auditable.
- **`cancelWithRefund()` (line 742)**: one shared path for cancel, reject, approved request and timeout, so refunds can't be forgotten.
- **Prices are never trusted from the client.** `placeOrder` reads each item's price from the menu table (lines 482–492), stores it as `unitPriceSnapshot`, and computes subtotal, 5% tax, Rs. 300 delivery and the discount on the server.

---

## 3. Teammate's menu module – design patterns

Full write-up: [MENU_MODULE_DESIGN_PATTERNS.md](MENU_MODULE_DESIGN_PATTERNS.md). Say it like this:

| Pattern | Lecture? | Classes | One-line explanation |
|---|---|---|---|
| **Observer** | ✅ Lecture 8 | `MenuItemService` (subject) → `ApplicationEventPublisher.publishEvent(MenuItemChangedEvent)` → `MenuItemChangeObserver.onMenuItemChanged` (observer) | When a menu item is created, updated or deleted, every registered observer is notified automatically. The service doesn't know who is listening (loose coupling). |
| **Strategy** | – | `MenuItemValidationStrategy` (interface) + `DefaultMenuItemValidationStrategy` | Validation rules are swappable without touching the service. |
| **Factory** (Simple) | – | `MenuItemFactory.createMenuItem / applyRequest` | One place converts a request DTO into a `MenuItem`, used for both create and update. |

**Mapping to the lecture's Observer slides:** Subject = Spring's `ApplicationEventPublisher` (keeps the observer list; `@Component` registration is `addObserver`). ConcreteSubject = `MenuItemService`. `notifyObservers()` = `publishEvent(...)`. Observer `update()` = `onMenuItemChanged(event)`. ConcreteObserver = `MenuItemChangeObserver`.

**Bonus point:** your order module uses the same Observer idea. `OrderService.transition()` publishes `OrderEvents.*` (Placed, Accepted, Dispatched, Completed, Cancelled…). `OrderEventListener` (inventory, promotions, delivery) and `branch/OrderSalesRecorder` (sales report) react to them after the transaction commits.

---

## 4. Overview of the code blocks

```
backend/src/main/java/com/example/BigBite/order/
├── controller/    OrderController          REST API /api/orders (29 endpoints)
├── service/       OrderService             all business rules: pricing, payment, lifecycle, cancel/refund, scheduled jobs
│                  CodEligibilityService    cash-on-delivery rules
│                  GuestTokenService        signed token so guests can see only their own order
│                  OrderRateLimiter         max 5 order placements per minute per user/IP
├── security/      OrderAccessGuard         WHO may do something (customer / guest token / staff / rider / manager / admin)
│                  OrderTransitionGuard     WHAT may happen next (the state machine)
├── entity/        Order, OrderItem, OrderStatusHistory, PaymentAttempt, SavedAddress      JPA entities (tables)
├── enums/         OrderStatus, PaymentStatus, RefundStatus, PaymentMethod, FulfillmentType, CancelRequestStatus
├── repository/    OrderRepository, OrderStatusHistoryRepository, PaymentAttemptRepository, SavedAddressRepository
├── exception/     OrderApiException (HTTP status + code), OrderRateLimitExceededException
├── dto/request/   what the client sends (OrderRequestDto, PaymentRequestDto, ReasonRequestDto, …)
├── dto/response/  what the API returns (OrderResponseDto, BillDto, PaymentOptionsDto, …)
├── event/         OrderEvents (messages) + OrderEventListener (observer)
└── external/      ports (interfaces) to other modules + CardValidator
    ├── jpa/       real adapters: JpaBranchLookupService, JpaMenuLookupService (branch and menu tables)
    └── mock/      stand-ins until those modules exist: payment, refund, inventory, promotion,
                   delivery, review, complaint
```

The layout copies the menu module (`menu/controller`, `menu/service`, `menu/repository`, …), so every module reads the same way. Tests mirror it: `src/test/.../order/service/OrderServiceTest`, `order/security/OrderTransitionGuardTest`, `order/controller/OrderHttpSecurityTest`, and so on.

Frontend pieces of the order module:

| File | Purpose |
|---|---|
| `api/orderApi.ts` | Every order API call (typed) |
| `types/order.ts` | TypeScript mirror of the DTOs |
| `pages/customer/CartPage.tsx`, `CheckoutPage.tsx`, `PaymentPage.tsx` | Create and pay |
| `pages/customer/OrderStatusPage.tsx` | Tracking, edit items, cancel/request cancel, bill, timeline, review/complaint |
| `pages/customer/OrderHistoryPage.tsx` | Customer's list |
| `pages/staff/StaffCommandCenter.tsx` + `components/orderboard/*` | Staff board, dialogs (rider, cash, reject), queues |
| `pages/delivery/DeliveryDashboard.tsx` | Rider |
| `pages/manager/ManagerOrdersPage.tsx` | Manager read-only board |
| `components/order/DeliveryTracker.tsx`, `OrderFeedback.tsx` | Live tracking and feedback |

---

## 5. Validations implemented

**Layer 1 – request format (Bean Validation on DTOs, returns `400 VALIDATION_ERROR`)**

| DTO | Rule |
|---|---|
| `OrderRequestDto` | `branchId` and `fulfillmentType` required; `items` not empty; each item validated (`@Valid`) |
| `OrderItemRequestDto` | `menuItemId` required; `quantity` ≥ 1 |
| `UpdateOrderItemRequestDto` | `quantity` ≥ 0 (0 removes the line) |
| `OrderStatusUpdateRequestDto` | `status` required |
| `CodCollectRequestDto` | `cashCollected` required, ≥ 0 |
| `ReasonRequestDto` | reason required, ≤ 255 chars (reject, cancel request) |
| `ReviewRequestDto` | rating 1–5, comment ≤ 500 |
| `ComplaintRequestDto` | category required, description 10–1000 chars |

**Layer 2 – business rules (in `OrderService` / guards)**

| Rule | Where | Error |
|---|---|---|
| Branch must exist and be open now | `placeOrder` line 396 | 400 |
| Takeaway only where the branch allows it; delivery needs an address | `placeOrder` | 400 |
| Guests must give name and phone; Sri Lankan phone format `07XXXXXXXX` / `+947XXXXXXXX` | line 427 | 400 |
| Max 20 distinct items, max 50 per line, no duplicate lines | line 436 | 400 |
| Item must exist, be available, and belong to the same branch | `placeOrder` | 400 |
| Minimum subtotal Rs. 500 | line 507 (and 839 on edit) | 400 / 422 `MINIMUM_SUBTOTAL` |
| Stock available (inventory port) | line 511 | 422 `ITEM_OUT_OF_STOCK` |
| Promo code valid | line 532 | 422 `INVALID_PROMO` |
| Items editable only before payment | `updateOrderItem` | 409 `ORDER_ITEMS_LOCKED` |
| Card number (Luhn), expiry, CVC | `order/external/CardValidator`, called at line 969 | 422 `INVALID_CARD_DETAILS` |
| Idempotency-Key required; same key never charges twice | `recordPayment` 922 | 400 / 409 |
| 3 declines cancel the order | `recordPayment` | 402 `PAYMENT_FAILED` |
| Cash on delivery only for signed-in customers, total ≤ Rs. 10,000, < 2 failed COD deliveries, < 2 open COD orders, branch allows COD | `CodEligibilityService` | 422 |
| Status changes follow the state machine; staff only; rider only for their own order | `OrderTransitionGuard.checkStaff` line 31 | 409 `INVALID_TRANSITION`, 403 |
| Cash received ≥ total | `collectCod` 1049 | 422 `INSUFFICIENT_CASH` |
| Dispatch needs an approved rider of the same branch | `updateOrderStatus` | 400 `RIDER_REQUIRED`, 422 `RIDER_NOT_ELIGIBLE` |
| Pending cancel request blocks the kitchen | `OrderTransitionGuard` | 409 `CANCEL_REQUEST_PENDING` |
| Review only after completion, once | `submitReviewFor` 295 | 409 |
| Complaint within 48 h of hand-over | `fileComplaintFor` 307 | 409 |
| Rate limit 5 orders/minute | `OrderController.placeOrder` + `OrderRateLimiter` | 429 `RATE_LIMITED` |

**Layer 3 – frontend** (`CheckoutPage`, `PaymentPage`): phone format, minimum subtotal, card number/expiry/CVC checks before submitting. These are a convenience only; the server always re-checks.

---

## 6. Where errors are thrown and how they reach the user

**One error class:** `OrderApiException(HttpStatus status, String code, String message)` (`order/exception/OrderApiException.java`) extends `common/exception/ApiException`.

**One handler:** `common/exception/GlobalExceptionHandler.java` turns every exception into the same JSON:

```json
{ "timestamp": "...", "status": 409, "error": "INVALID_TRANSITION", "message": "Cannot move order from PAYMENT_VERIFIED to PREPARING" }
```

| Thrown in | How many | Typical codes |
|---|---:|---|
| `OrderService` | 40 `OrderApiException` + 23 `IllegalArgumentException` | `CANCEL_REQUEST_REQUIRED`, `CANCELLATION_LOCKED`, `ORDER_ITEMS_LOCKED`, `INVALID_CARD_DETAILS`, `INSUFFICIENT_CASH`, `RIDER_NOT_ELIGIBLE`, `REFUND_FAILED`, `ALREADY_REVIEWED` … |
| `OrderAccessGuard` | 6 | `AUTH_REQUIRED` (401), `ACCESS_DENIED`, `STAFF_REQUIRED`, `ACCOUNT_INACTIVE`, `INVALID_GUEST_TOKEN` (403), `ORDER_NOT_FOUND` (404) |
| `OrderTransitionGuard` | 7 | `INVALID_TRANSITION`, `CANCEL_REQUEST_PENDING`, `ORDER_NOT_PAYABLE`, `PAYMENT_METHOD_LOCKED`, `COD_NOT_COLLECTABLE` (409) |
| `CodEligibilityService` | 1 | `COD_LOGIN_REQUIRED`, `COD_LIMIT_EXCEEDED` … (422) |
| `OrderController` | 4 | `CUSTOMER_REQUIRED`, `AUTH_REQUIRED`, `RATE_LIMITED` |
| Bean Validation (`@Valid`) | – | `VALIDATION_ERROR` + an `errors` map per field |

**Frontend:** `lib/http.ts` → `apiRequest` throws `ApiError` with `status`, `code` and `message`. Pages show `message` in a toast or alert. The payment page reads `status === 402` to show "attempts left". The order page reads `code === 'CANCEL_REQUEST_REQUIRED'`.

**Payment declines** are not exceptions. `recordPayment` returns `PaymentResult(402, …)` and the controller builds `{error, declineCode, message, attemptsRemaining, order}` (line 332), because a decline is a normal business outcome.

---

## 7. Why the order module handles everything about orders

| Concern | Handled in the order module by |
|---|---|
| Cart → order, pricing, tax, delivery fee, discount | `OrderService.placeOrder` (server-side, snapshot prices) |
| Guest and customer ownership | `GuestTokenService`, `OrderAccessGuard` |
| Payment (card + cash), idempotency, attempt limit | `recordPayment`, `PaymentAttempt`, `CardValidator`, `PaymentGateway` port |
| Staff acceptance, kitchen pipeline, dispatch, hand-over | `updateOrderStatus`, `OrderTransitionGuard`, `collectCod`, `markDeliveryFailed` |
| Cancellation, rejection, cancel requests, refunds | `cancelOrder`, `rejectOrder`, `requestCancellation`, `resolveCancellation`, `cancelWithRefund`, `retryRefund` |
| Timeouts and retries | `@Scheduled` jobs: unpaid cards cancelled after 15 min, unaccepted orders rejected after 10 min, refunds retried every 5 min |
| Audit trail | `OrderStatusHistory` written by `transition()` |
| Tracking, reviews, complaints | `DeliveryService`, `ReviewService`, `ComplaintService` ports with order-side rules |
| Feeding other modules | `OrderEvents` → inventory, promotions, delivery, branch sales report |
| UI for every role | customer pages, staff Command Center, rider dashboard, manager read-only board |

Other modules are only **read** through interfaces (`BranchLookupService`, `MenuLookupService`). The order module never writes branch or menu data, and no other module changes an order. All order state lives behind `OrderService`.

Evidence: 73 automated order tests plus a live run of 74/74 steps (`ORDER_MODULE_TEST_REPORT.md`).

---

## 8. Database – tables and a live demo

Database: **Aiven MySQL** (`backend/.env` → `DB_URL`). Tables are created and updated by Hibernate (`spring.jpa.hibernate.ddl-auto=update`).

| Table | Entity | What it stores |
|---|---|---|
| `orders` | `Order` | One row per order: customer/guest, branch + name/address snapshot, fulfillment, status, money columns, payment and refund status, card brand and last 4, rider, cancel request, timestamps, `version` (optimistic lock) |
| `order_items` | `OrderItem` | Lines: `menu_item_id`, `item_name_snapshot`, `unit_price_snapshot`, `quantity`, `line_total` (FK `order_id`) |
| `order_status_history` | `OrderStatusHistory` | Audit trail: from → to status, actor id and role, note, time |
| `order_payment_attempts` | `PaymentAttempt` | Each payment try: idempotency key, method, HTTP result, status, gateway reference |
| `saved_addresses` | `SavedAddress` | Customer's delivery addresses |
| `branch_sales` *(branch module)* | `BranchSale` | Written by the order module's completion event, so reports show real revenue |

**Live DB demo** (open the Aiven console's query tab, IntelliJ Database tool or MySQL Workbench with the `.env` connection):

```sql
-- 1. The order you just placed
SELECT id, status, payment_method, payment_status, grand_total, contact_name, created_at
FROM orders ORDER BY id DESC LIMIT 5;

-- 2. Its lines (prices frozen at order time)
SELECT item_name_snapshot, unit_price_snapshot, quantity, line_total
FROM order_items WHERE order_id = <ID>;

-- 3. Every status change and who made it
SELECT from_status, to_status, actor_role, note, changed_at
FROM order_status_history WHERE order_id = <ID> ORDER BY id;

-- 4. Payment attempts (decline + approval)
SELECT idempotency_key, method, http_status, payment_status, gateway_reference
FROM order_payment_attempts WHERE order_id = <ID>;

-- 5. Completed order recorded as a branch sale
SELECT order_number, total_amount, payment_method, sale_date
FROM branch_sales WHERE order_number = CONCAT('ORD-', <ID>);
```

Demo flow: run query 1 → click **Accept** in the staff UI → run queries 1 and 3 again (status changed, new history row) → complete the order → run query 5.

---

## 9. If asked to change a colour

**All colours are in one file: `frontend/src/styles/theme.css`.** Light values are under `:root`, dark values under `.dark`. Components never hard-code colours; they use Tailwind classes built from these variables (`bg-primary`, `text-muted-foreground`, `text-success`, `border-border`…).

| Request | Change in `theme.css` |
|---|---|
| "Make the main colour blue" | `--primary: #2F5E9E;` (also `--accent`) – buttons, links, active tabs, logo, badges follow |
| "Change the page background" | `--background` (light) or the `.dark` block's `--background` |
| "Make text darker / lighter" | `--foreground`, `--muted-foreground` |
| "Change the success/green colour" | `--success` |
| "Change the 'Preparing' badge colour" | `--status-preparing` |
| "Rounder or sharper corners" | `--radius` (e.g. `1rem` or `0.25rem`) |
| "Change the font" | `--app-font` (and add the font link in `frontend/index.html`) |

With `npm run dev` running, save the file and the browser updates instantly (no restart).

**Changing one element only** (e.g. "make the Accept button green"): open the component and swap its class, e.g. in `components/orderboard/OrderCard.tsx` the primary action button uses `bg-primary hover:bg-primary-hover`. Change it to `bg-success hover:bg-success/90`. Explain that you still use a theme token, so dark mode keeps working.

---

## 10. What, why and how of each file type

| Type | Files | What | Why | How |
|---|---|---|---|---|
| **Controller** | `controller/OrderController` | Maps HTTP requests to service calls (`/api/orders/...`) | Keeps HTTP details (headers, status codes, guest token, Idempotency-Key) out of business logic | `@RestController`, `@PostMapping`…, `@Valid @RequestBody` DTOs, reads the signed-in user from `@AuthenticationPrincipal`, returns `ResponseEntity` |
| **Service** | `service/OrderService`, `CodEligibilityService`, `GuestTokenService`, `OrderRateLimiter` | Business rules and transactions | One place for every rule, so the UI or another client can't bypass them | `@Service @Transactional`; constructor injection; `*For(...)` methods check access first, then call the core method |
| **Guards** | `security/OrderAccessGuard`, `OrderTransitionGuard` | Who may act / which transition is allowed | Security and the state machine stay small, readable and testable on their own | Throw `OrderApiException` with 401/403/409 |
| **Entity (class)** | `entity/Order`, `OrderItem`, `OrderStatusHistory`, `PaymentAttempt`, `SavedAddress` | Database tables as Java objects | JPA/Hibernate maps them to MySQL | `@Entity @Table`; `@OneToMany` items; `@Version` for optimistic locking; enums stored as text |
| **Repository** | `repository/OrderRepository`, `OrderStatusHistoryRepository`, `PaymentAttemptRepository`, `SavedAddressRepository` | Database queries | No SQL boilerplate; queries named by intent | `extends JpaRepository`; derived queries (`findByBranchIdOrderByCreatedAtDesc`); `@Query` for timeout searches; `@Lock(PESSIMISTIC_WRITE)` in `findByIdForUpdate` so two payments can't race |
| **DTOs** | `dto/request/*`, `dto/response/*` | Shapes of requests and responses | Never expose entities directly; validate input; hide internal fields; a stable contract for the frontend | Request DTOs carry `@NotNull/@Min/@Size`; `OrderResponseDto` is built by `toOrderResponseDto` (line 1207); records for small ones |
| **Events** | `event/OrderEvents`, `event/OrderEventListener` | Messages after a status change, plus reactions | Observer pattern: inventory, promotions, delivery and sales react without `OrderService` depending on them | `eventPublisher.publishEvent(new OrderEvents.Completed(id))` in `transition()`; listeners use `@TransactionalEventListener(AFTER_COMMIT)`, so a rolled-back change is never announced |
| **Enums** | `enums/OrderStatus`, `PaymentStatus`, … | Fixed sets of states | Type-safe; no typos in status strings | Stored as `VARCHAR` |
| **External ports** | `external/*` (`jpa/` real, `mock/` stand-ins) | Interfaces to other modules, with real or mock implementations | Other teams' modules can plug in later without changing order code | e.g. `PaymentGateway` interface → `MockPaymentGateway`; `MenuLookupService` → `JpaMenuLookupService` (real DB) |

---

## 11. Likely live-change requests and how to answer them

Keep `OrderService.java`, `application.properties` and `theme.css` open. After a backend change, restart the backend (or press Build in IntelliJ, since DevTools restarts it). Frontend changes update instantly.

| They might ask | Do this | Show it |
|---|---|---|
| "Change the minimum order to Rs. 1000" | `application.properties`: `bigbite.order.min-subtotal=${ORDER_MIN_SUBTOTAL:1000.00}` | Order one Coca-Cola → error "Minimum order subtotal is LKR 1000.00" |
| "Change tax to 8%" / "delivery fee to 250" | `bigbite.order.tax-rate=0.08` / `bigbite.order.delivery-fee=250.00` | New order bill shows the new values (old orders keep theirs: snapshots) |
| "Limit quantity to 10 per item" | `OrderService.java` line 98: `MAX_ITEM_QUANTITY = 10` | Order 11 → 400 "cannot exceed 10" |
| "Change the acceptance timeout to 2 minutes" | `bigbite.order.acceptance-timeout-minutes=2` | Explain the `@Scheduled` job (`scheduleAutoCancelAbandonedOrders`, every 60 s) |
| "Change an error message" | Find the code, e.g. `"CANCEL_REQUEST_REQUIRED"` in `OrderService.cancelOrder` (line 654), and edit the text | Customer tries to cancel after acceptance and sees the new text |
| "Add a new validation" (e.g. delivery address ≥ 10 chars) | In `placeOrder` next to the address check: `if (request.getDeliveryAddress().trim().length() < 10) throw new IllegalArgumentException("Address is too short");` | 400 `VALIDATION_ERROR` in the UI |
| "Add a field to the response" (e.g. item count) | `OrderResponseDto`: add `private int itemCount` + getter/setter; in `toOrderResponseDto` (line 1207): `dto.setItemCount(order.getItems().size())` | Open `/api/orders/{id}` in the browser or the network tab |
| "Add a new endpoint" (e.g. count today's orders for a branch) | Repository: `long countByBranchIdAndCreatedAtAfter(Long branchId, LocalDateTime t);` → service method → `@GetMapping("/count")` in the controller | Call it from the browser or `backend/api-tests/bigbite.http` |
| "Who can do X?" | Point at `OrderAccessGuard` (who) and `OrderTransitionGuard` (what next) | Manager clicks Accept → 403 `STAFF_REQUIRED` |
| "Show the state machine" | `OrderTransitionGuard.checkStaff` (line 31) | Drag a card two columns ahead → toast "Can't move…" |
| "Why can't two staff accept the same order twice?" | `@Version` on `Order` (optimistic lock) + row lock in `findByIdForUpdate` for payments | `OrderConcurrencyTest` |
| "Change a colour" | Section 9 | Save `theme.css` → app updates |
| "Show it is saved in the DB" | Section 8 queries | Run before and after an action |
| "Run the tests" | `cd backend && ./mvnw test -Dtest='Order*Test,CardPaymentTest'` | All green |
| "Which design pattern is in your module?" | Observer: `transition()` publishes `OrderEvents`; `OrderEventListener` and `OrderSalesRecorder` observe (after commit) | Complete an order → branch report increases |
| "What happens if payment is retried?" | Same `Idempotency-Key` → saved first response, no second charge (`recordPayment` line 922) | Covered in `OrderServiceTest.paymentKeyReturnsOriginalSnapshot` |

**Golden rules for answering**
1. Point to the exact file and method; don't explain from memory alone.
2. Validation is done twice (frontend for convenience, backend as authority). Say why: the client can't be trusted.
3. Money and prices are always computed on the server from snapshots.
4. Orders are never deleted; cancellation keeps the audit trail and allows refunds.
5. Every status change goes through `transition()` → history row + event.
