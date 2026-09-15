# BigBite — Order & Billing Module

A robust, self-contained **Order & Billing Module** built for the **BigBite** food-ordering platform. Designed to integrate seamlessly with parallel microservices/modules through mocked service interfaces until other branch modules (Branch Management, Menu Management, Rider & Delivery, Promotions & Discounts, Inventory & Stock, Auth/RBAC) are merged.

---

## Table of Contents
1. [Architecture & Design](#architecture--design)
2. [Order Lifecycle & State Machine](#order-lifecycle--state-machine)
3. [Mock Services Catalog](#mock-services-catalog)
4. [Backend API Reference](#backend-api-reference)
5. [Data Models & Schema](#data-models--schema)
6. [Frontend Architecture & Routes](#frontend-architecture--routes)
7. [Getting Started & Setup](#getting-started--setup)
8. [Automated Tests & Quality Gates](#automated-tests--quality-gates)
9. [End-to-End Verification Guide](#end-to-end-verification-guide)

---

## Architecture & Design

The module is partitioned into a Spring Boot 4.1.x / Java 21 REST API backend and a modern React 19 + Vite + Tailwind CSS v4 client.

```
BigBite/
├── backend/
│   └── src/main/java/com/example/BigBite/order/
│       ├── Order.java                         # Primary order entity
│       ├── OrderItem.java                     # Order line item with frozen snapshots
│       ├── OrderStatus.java                   # State machine enum
│       ├── FulfillmentType.java               # DELIVERY / TAKEAWAY enum
│       ├── PaymentStatus.java                 # PENDING / VERIFIED / FAILED enum
│       ├── OrderRepository.java               # Spring Data JPA repository
│       ├── OrderService.java                  # Business validation, calculations, state rules
│       ├── OrderController.java               # 8 REST endpoints + global error handling
│       ├── dto/                               # Typed request & response DTOs
│       └── external/                          # Mock services for external boundaries
└── frontend/
    └── src/
        ├── api/orderApi.ts                    # Typed API client for /api/orders
        ├── context/CartContext.tsx            # In-memory cart provider & calculations
        ├── mocks/orderMockData.ts             # 1:1 synchronized mock branch & menu data
        ├── types/order.ts                     # TypeScript interfaces
        ├── components/
        │   ├── Navbar.tsx                     # Global navigation bar & cart badge
        │   └── StatusStepper.tsx              # Visual horizontal pipeline tracker
        └── pages/
            ├── BranchSelectPage.tsx           # Route: /
            ├── MenuPage.tsx                   # Route: /branch/:branchId/menu
            ├── CartPage.tsx                   # Route: /cart
            ├── CheckoutPage.tsx               # Route: /checkout
            ├── PaymentPage.tsx                # Route: /order/:orderId/payment
            ├── OrderStatusPage.tsx            # Route: /order/:orderId
            ├── OrderHistoryPage.tsx           # Route: /orders
            └── StaffOrderListPage.tsx         # Route: /staff/orders
```

---

## Order Lifecycle & State Machine

Order statuses follow an exact sequential pipeline. Any status update that attempts to skip or reverse steps is strictly rejected with an `HTTP 400` error.

```
[PLACED]
   │
   ▼
[PAYMENT_VERIFIED]  (Recorded via POST /api/orders/{id}/payment)
   │
   ▼
[CONFIRMED]
   │
   ▼
[PREPARING] ─── (CANCELLATION LOCKED FROM THIS POINT FORWARD)
   │
   ├─ If Fulfillment = DELIVERY:
   │    │
   │    ▼
   │  [OUT_FOR_DELIVERY] ──► [DELIVERED] ──► [COMPLETED]
   │
   └─ If Fulfillment = TAKEAWAY:
        │
        ▼
      [READY_FOR_PICKUP] ────────────────► [COMPLETED]
```

### Cancellation Policy
- **Allowed States**: `PLACED`, `PAYMENT_VERIFIED`, and `CONFIRMED`.
- **Locked States**: `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `COMPLETED`.
- Attempting cancellation when status is `PREPARING` or later throws `IllegalStateException` and returns `400 Bad Request` with an explanatory error message.

---

## Mock Services Catalog

Until upstream microservices are merged, mock services simulate operational checks using standardized IDs:

### 1. BranchLookupService
| Branch ID | Name | Is Open | Supports Takeaway |
|---|---|---|---|
| `1` | Colombo Branch | `true` | `true` |
| `2` | Jaffna Branch | `false` (Closed) | `false` |
| `3` | Kandy Branch | `true` | `true` |

### 2. MenuLookupService
| Menu Item ID | Item Name | Unit Price (Rs.) | Branch ID |
|---|---|---|---|
| `101` | Margherita Pizza | 1,200.00 | 1 (Colombo) |
| `102` | Pepperoni Pizza | 1,400.00 | 1 (Colombo) |
| `103` | Garlic Bread | 450.00 | 1 (Colombo) |
| `201` | BBQ Chicken Pizza | 1,500.00 | 3 (Kandy) |
| `202` | Coke 500ml | 250.00 | 3 (Kandy) |

### 3. PromotionValidationService
- Promo Code `"WELCOME10"`: Validates successfully and applies a **10% discount** off the items subtotal.
- Any other promo code: Rejected with `"Invalid promo code"`.

### 4. InventoryCheckService
- `isInStock(menuItemId, quantity)`: Returns `true`.
- `decrementStock(menuItemId, quantity)`: No-op mock.

---

## Backend API Reference

Base URL: `http://localhost:8080/api/orders`

### 1. Place Order
- **Endpoint**: `POST /api/orders`
- **Request Body**:
```json
{
  "customerId": null,
  "guestName": "John Doe",
  "guestPhone": "+94771234567",
  "guestEmail": "john@example.com",
  "branchId": 1,
  "fulfillmentType": "DELIVERY",
  "deliveryAddress": "42 Galle Road, Colombo 03",
  "promoCode": "WELCOME10",
  "items": [
    { "menuItemId": 101, "quantity": 2 },
    { "menuItemId": 103, "quantity": 1 }
  ]
}
```
- **Response (201 Created)**: Returns the persisted `OrderResponseDto` with calculated financial breakdown.

### 2. Get Order by ID
- **Endpoint**: `GET /api/orders/{id}`

### 3. Get Itemized Bill
- **Endpoint**: `GET /api/orders/{id}/bill`
- **Response (200 OK)**:
```json
{
  "orderId": 1,
  "customerId": null,
  "customerOrGuestName": "John Doe",
  "branchId": 1,
  "fulfillmentType": "DELIVERY",
  "deliveryAddress": "42 Galle Road, Colombo 03",
  "items": [
    {
      "menuItemId": 101,
      "itemNameSnapshot": "Margherita Pizza",
      "unitPriceSnapshot": 1200.00,
      "quantity": 2,
      "lineTotal": 2400.00
    },
    {
      "menuItemId": 103,
      "itemNameSnapshot": "Garlic Bread",
      "unitPriceSnapshot": 450.00,
      "quantity": 1,
      "lineTotal": 450.00
    }
  ],
  "subtotal": 2850.00,
  "deliveryFee": 300.00,
  "taxRatePercent": 5.00,
  "taxAmount": 142.50,
  "promoCode": "WELCOME10",
  "discountAmount": 285.00,
  "grandTotal": 3007.50,
  "paymentStatus": "VERIFIED",
  "orderStatus": "CONFIRMED",
  "createdAt": "2026-09-15T14:30:00"
}
```

### 4. Record Payment Result (Mock Gateway)
- **Endpoint**: `POST /api/orders/{id}/payment`
- **Request Body**:
```json
{
  "success": true
}
```
*When `success: true`, updates `paymentStatus` to `VERIFIED` and advances order status to `PAYMENT_VERIFIED`.*

### 5. Advance Order Status
- **Endpoint**: `PUT /api/orders/{id}/status`
- **Request Body**:
```json
{
  "status": "CONFIRMED"
}
```

### 6. Cancel Order
- **Endpoint**: `POST /api/orders/{id}/cancel`
*Succeeds if status is `PLACED`, `PAYMENT_VERIFIED`, or `CONFIRMED`. Returns 400 if `PREPARING` or later.*

### 7. Filter & List Orders
- `GET /api/orders?customerId=1` — Retrieve past orders for a customer
- `GET /api/orders?branchId=1&status=PREPARING` — Filter queue for branch staff

---

## Data Models & Schema

### `orders` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | BIGINT | Primary Key, Auto-increment |
| `customer_id` | BIGINT | Nullable (null indicates guest) |
| `guest_name` | VARCHAR(255) | Required if `customer_id` is null |
| `guest_phone` | VARCHAR(255) | Required if `customer_id` is null |
| `guest_email` | VARCHAR(255) | Optional guest email |
| `branch_id` | BIGINT | Not null |
| `fulfillment_type` | VARCHAR(32) | `DELIVERY` or `TAKEAWAY` |
| `delivery_address` | VARCHAR(500) | Required if `DELIVERY` |
| `status` | VARCHAR(32) | Default `PLACED` |
| `subtotal` | DECIMAL(10,2) | Sum of frozen item line totals |
| `delivery_fee` | DECIMAL(10,2) | 300.00 if `DELIVERY`, else 0.00 |
| `tax_amount` | DECIMAL(10,2) | 5% of subtotal |
| `discount_amount` | DECIMAL(10,2) | From promo code calculation |
| `grandTotal` | DECIMAL(10,2) | `subtotal + deliveryFee + tax - discount` |
| `promo_code` | VARCHAR(64) | Optional code applied |
| `payment_status` | VARCHAR(32) | `PENDING`, `VERIFIED`, `FAILED` |
| `created_at` | DATETIME | Order creation timestamp |
| `updated_at` | DATETIME | Last update timestamp |

### `order_items` Table
| Column | Type | Description |
|---|---|---|
| `id` | BIGINT | Primary Key, Auto-increment |
| `order_id` | BIGINT | Foreign Key referencing `orders.id` |
| `menu_item_id` | BIGINT | Menu item ID reference |
| `item_name_snapshot`| VARCHAR(255) | Snapshotted name at order time |
| `unit_price_snapshot`| DECIMAL(10,2)| Snapshotted unit price at order time |
| `quantity` | INT | Quantity ordered |
| `line_total` | DECIMAL(10,2)| `unitPriceSnapshot * quantity` |

---

## Frontend Architecture & Routes

| Route | Component | Description |
|---|---|---|
| `/` | `BranchSelectPage` | Cards for Colombo, Jaffna (closed), and Kandy with quick status badges. |
| `/branch/:branchId/menu` | `MenuPage` | Displays items scoped to selected branch with add/remove quantity selectors and sticky cart drawer. |
| `/cart` | `CartPage` | Cart item management, fulfillment toggle (Delivery vs Takeaway), delivery address, and `WELCOME10` promo code input. |
| `/checkout` | `CheckoutPage` | Toggle between Guest checkout and Customer #1 login, address confirmation, and final submission. |
| `/order/:orderId/payment` | `PaymentPage` | Mock gateway with simulated Success and Failure triggers. |
| `/order/:orderId` | `OrderStatusPage` | Live horizontal stepper tracker, itemized bill breakdown, and cancellation button (locked after preparation). |
| `/orders` | `OrderHistoryPage` | Customer order list with history tracking and quick links. |
| `/staff/orders` | `StaffOrderListPage` | Interactive staff console to filter orders by branch and advance orders sequentially along the pipeline. |

---

## Getting Started & Setup

### 1. Run the Backend (Spring Boot)
```bash
cd backend
./mvnw spring-boot:run
```
*API runs on `http://localhost:8080`.*

### 2. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000` with `/api` proxying to `http://localhost:8080`.*

---

## Automated Tests & Quality Gates

Run the comprehensive unit test suite:
```bash
cd backend
./mvnw test -Dtest=OrderServiceTest
```

**Verified Test Scenarios**:
- `testCancellationRejectedWhenPreparingOrLater`: Verifies orders cannot be cancelled once `PREPARING`, `READY_FOR_PICKUP`, `OUT_FOR_DELIVERY`, or `COMPLETED`.
- `testOrderPlacementRejectedWhenBranchClosed`: Verifies closed branches (e.g. Jaffna) reject order placement.
- `testOrderPlacementRejectedWhenTakeawayNotSupported`: Verifies takeaway cannot be requested for branches without takeaway support.
- `testGuestOrderRejectedWithoutNameOrPhone`: Verifies guest orders must provide both name and phone.
- `testPromoCodeWelcome10AppliesTenPercent`: Verifies `WELCOME10` calculates 10% off and invalid codes are discarded.
- `testBillTotalMathIsCorrect`: Verifies multi-item bill arithmetic (`subtotal + delivery fee + 5% tax - discount = grandTotal`).
- `testStatusTransitionValidation`: Verifies status transitions must follow the exact pipeline.
- `testRecordPaymentSuccess`: Verifies payment verification transitions order status to `PAYMENT_VERIFIED`.

Run the frontend type check & production build:
```bash
cd frontend
npm run build
```

---

## End-to-End Verification Guide

### Quick Test via UI:
1. Open `http://localhost:3000` in your browser.
2. Select **Colombo Branch** (Branch 1).
3. Add **Margherita Pizza** and **Garlic Bread** to the cart.
4. Click **View Cart**, enter promo code `WELCOME10`, click **Apply** (10% discount applied).
5. Choose **Delivery**, enter a delivery address, and proceed to **Checkout**.
6. Enter your Guest Name and Phone, click **Place Order Now**.
7. On the **Mock Payment Gateway**, click **Simulate Payment Success**.
8. View the **Live Status Tracker** at `/order/:id` with the horizontal stepper.
9. Open `/staff/orders` in a new tab to see your order appear in real-time, and advance it to **Confirm Order** and **Start Preparing**.
10. Return to the customer status page: note that the **Cancel Order** button is now disabled/locked because preparation has started!
