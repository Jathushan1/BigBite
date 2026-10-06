"""Live acceptance tests for the BigBite order module against the running backend + Aiven MySQL.

Writes a JSON results file consumed by the markdown report generator.
"""
import json
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime

BASE = "http://localhost:8080"
RESULTS = []
CURRENT = None


def call(method, path, body=None, token=None, headers=None, retry_rate_limit=True):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    started = time.time()
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            status, raw = res.status, res.read().decode()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read().decode()
    if status == 429 and retry_rate_limit:
        time.sleep(61)
        return call(method, path, body, token, headers, retry_rate_limit=False)
    try:
        payload = json.loads(raw) if raw else None
    except json.JSONDecodeError:
        payload = raw
    return status, payload, int((time.time() - started) * 1000)


def scenario(sid, title, purpose):
    global CURRENT
    CURRENT = {"id": sid, "title": title, "purpose": purpose, "steps": []}
    RESULTS.append(CURRENT)


def step(name, method, path, expect_status, body=None, token=None, headers=None, check=None, note=None):
    status, payload, ms = call(method, path, body, token, headers)
    ok = status == expect_status
    detail = ""
    if ok and check:
        try:
            result = check(payload)
            if result is True or result is None:
                pass
            else:
                ok, detail = bool(result[0]), result[1]
        except Exception as exc:  # noqa: BLE001
            ok, detail = False, f"check failed: {exc}"
    observed = summarize(payload)
    CURRENT["steps"].append({
        "name": name, "request": f"{method} {path}", "expected": expect_status, "actual": status,
        "ok": ok, "observed": detail or observed, "ms": ms, "note": note,
    })
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}: {status} ({ms} ms) {detail or observed}")
    return payload


def summarize(p):
    if isinstance(p, dict):
        if "error" in p and "message" in p:
            return f"{p['error']}: {p['message']}"
        keys = ["status", "paymentStatus", "awaitingAcceptance", "refundStatus", "grandTotal", "changeGiven",
                "cancelRequestStatus", "riderName", "stage", "etaMinutes", "rating", "totalOrders", "totalRevenue",
                "cardLast4", "message"]
        parts = [f"{k}={p[k]}" for k in keys if k in p and p[k] not in (None, "")]
        return ", ".join(parts[:6])
    if isinstance(p, list):
        return f"{len(p)} record(s)"
    return str(p)[:120] if p else ""


def login(email, password):
    status, payload, _ = call("POST", "/api/auth/login", {"email": email, "password": password})
    assert status == 200, (email, status, payload)
    return payload["token"], payload


def card(number):
    return {"holderName": "Live Test", "number": number, "expMonth": 12, "expYear": 2030, "cvc": "123"}


def pay(order_id, method, token=None, guest=None, card_number=None, key=None):
    headers = {"Idempotency-Key": key or f"live-{order_id}-{uuid.uuid4()}"}
    if guest:
        headers["X-Guest-Token"] = guest
    body = {"method": method}
    if card_number:
        body["card"] = card(card_number)
    return headers, body


def main():
    run_started = datetime.now()
    print("Signing in demo accounts")
    staff, _ = login("staff.cmb03@bigbite.lk", "Staff@123")
    rider, rider_info = login("rider.cmb03@bigbite.lk", "Rider@123")
    manager, _ = login("manager.cmb03@bigbite.lk", "Manager@123")
    admin, _ = login("admin@bigbite.com", "Admin@123")
    other_staff, _ = login("staff.kdy01@bigbite.lk", "Staff@123")

    suffix = uuid.uuid4().hex[:6]
    cust_email = f"live.customer.{suffix}@example.com"
    call("POST", "/api/auth/register/customer",
         {"name": "Live Test Customer", "email": cust_email, "phoneNumber": "0771234567", "password": "Customer@123"})
    customer, cust_info = login(cust_email, "Customer@123")
    other_email = f"live.other.{suffix}@example.com"
    call("POST", "/api/auth/register/customer",
         {"name": "Other Customer", "email": other_email, "phoneNumber": "0771234568", "password": "Customer@123"})
    other_customer, _ = login(other_email, "Customer@123")

    menu = call("GET", "/api/menu/branch/1?availableOnly=true")[1]
    by_name = {m["menuName"]: m for m in menu}
    pizza = by_name["Margherita Pizza"]
    burger = by_name["Classic Beef Burger"]
    coke = by_name["Coca-Cola 330ml"]

    # ------------------------------------------------------------------ TC-01
    scenario("TC-01", "Real branch and menu data reach the order module",
             "Orders are priced from the live menu table and blocked at branches that are closed.")
    step("Public branch directory", "GET", "/api/branches", 200,
         check=lambda p: (len(p) >= 3, f"{len(p)} branches, open now: " + ", ".join(b['name'] for b in p if b['openNow'])))
    step("Public menu for Colombo 03", "GET", "/api/menu/branch/1?availableOnly=true", 200,
         check=lambda p: (len(p) > 0, f"{len(p)} available items, e.g. {pizza['menuName']} Rs. {pizza['price']}"))
    step("Order at a closed branch (Kandy, outside 08:00–23:30) is refused", "POST", "/api/orders", 400,
         {"branchId": 2, "fulfillmentType": "TAKEAWAY", "guestName": "Live Guest", "guestPhone": "0771234567",
          "items": [{"menuItemId": pizza["menuId"], "quantity": 1}]})
    step("Unknown menu item is refused", "POST", "/api/orders", 400,
         {"branchId": 1, "fulfillmentType": "TAKEAWAY", "guestName": "Live Guest", "guestPhone": "0771234567",
          "items": [{"menuItemId": 999999, "quantity": 1}]})
    step("Subtotal under Rs. 500 is refused", "POST", "/api/orders", 400,
         {"branchId": 1, "fulfillmentType": "TAKEAWAY", "guestName": "Live Guest", "guestPhone": "0771234567",
          "items": [{"menuItemId": coke["menuId"], "quantity": 1}]})

    # ------------------------------------------------------------------ TC-02
    scenario("TC-02", "Guest takeaway with card: decline, approve, staff pipeline, sales",
             "A guest pays by card (one decline first), staff accept and complete, and the sale reaches the branch report.")
    report_before = call("GET", "/api/manager/branch/reports/monthly", token=manager)[1]
    order = step("Guest places takeaway order (2 × Margherita)", "POST", "/api/orders", 201,
                 {"branchId": 1, "fulfillmentType": "TAKEAWAY", "guestName": "Live Guest", "guestPhone": "0771234567",
                  "items": [{"menuItemId": pizza["menuId"], "quantity": 2}]},
                 check=lambda p: (p.get("guestToken") and abs(p["grandTotal"] - round(pizza["price"] * 2 * 1.05, 2)) < 0.01,
                                  f"grandTotal={p['grandTotal']} (2×{pizza['price']} + 5% tax), guest token issued"))
    oid, gtok = order["id"], order["guestToken"]
    step("Reading the order without the guest token is denied", "GET", f"/api/orders/{oid}", 401)
    step("Payment options: cash not offered to guests", "GET", f"/api/orders/{oid}/payment-options", 200,
         headers={"X-Guest-Token": gtok}, check=lambda p: (p["codEligible"] is False, f"codEligible=false ({p['codReason']})"))
    h, b = pay(oid, "CREDIT_CARD", guest=gtok, card_number="4242424242424241")
    step("Card failing the Luhn check is rejected without using an attempt", "POST", f"/api/orders/{oid}/payment", 422, b, headers=h)
    h, b = pay(oid, "CREDIT_CARD", guest=gtok, card_number="4000000000000002")
    step("Declined test card returns 402 with attempts remaining", "POST", f"/api/orders/{oid}/payment", 402, b, headers=h,
         check=lambda p: (p["attemptsRemaining"] == 2 and p["declineCode"] == "CARD_DECLINED",
                          f"{p['declineCode']}, attemptsRemaining={p['attemptsRemaining']}"))
    key = f"live-idem-{oid}"
    h, b = pay(oid, "CREDIT_CARD", guest=gtok, card_number="4242424242424242", key=key)
    step("Approved test card verifies payment; order waits for staff", "POST", f"/api/orders/{oid}/payment", 200, b, headers=h,
         check=lambda p: (p["status"] == "PAYMENT_VERIFIED" and p["awaitingAcceptance"] and p["cardLast4"] == "4242",
                          f"status={p['status']}, awaitingAcceptance=true, card ****{p['cardLast4']}"))
    step("Repeating the same Idempotency-Key replays the result (no second charge)", "POST", f"/api/orders/{oid}/payment", 200,
         b, headers=h, check=lambda p: (p["status"] == "PAYMENT_VERIFIED", "same response replayed"))
    step("Branch manager cannot accept orders", "POST", f"/api/orders/{oid}/accept", 403, token=manager)
    step("Staff from another branch cannot accept", "POST", f"/api/orders/{oid}/accept", 403, token=other_staff)
    step("Kitchen cannot start before acceptance", "PUT", f"/api/orders/{oid}/status", 409, {"status": "PREPARING"}, token=staff)
    step("Staff accepts", "POST", f"/api/orders/{oid}/accept", 200, token=staff,
         check=lambda p: (p["status"] == "CONFIRMED", "status=CONFIRMED"))
    for target in ["PREPARING", "READY_FOR_PICKUP", "COMPLETED"]:
        step(f"Staff moves order to {target}", "PUT", f"/api/orders/{oid}/status", 200, {"status": target}, token=staff,
             check=lambda p, t=target: (p["status"] == t, f"status={p['status']}"))
    history = step("Audit trail has every step", "GET", f"/api/orders/{oid}/history", 200, headers={"X-Guest-Token": gtok},
                   check=lambda p: ([e["toStatus"] for e in p][-1] == "COMPLETED",
                                    " → ".join(e["toStatus"] for e in p)))
    time.sleep(2)
    step("Completed order is recorded in the branch sales report", "GET", "/api/manager/branch/reports/monthly", 200, token=manager,
         check=lambda p: (p["totalOrders"] == report_before["totalOrders"] + 1,
                          f"orders {report_before['totalOrders']} → {p['totalOrders']}, revenue Rs. {report_before['totalRevenue']} → Rs. {p['totalRevenue']}"))

    # ------------------------------------------------------------------ TC-03
    scenario("TC-03", "Customer delivery with cash on delivery, rider hand-over, review and complaint",
             "COD waits for staff acceptance, a rider is dispatched and tracked, cash and change are recorded, feedback works.")
    order = step("Customer places delivery order (burger + pizza)", "POST", "/api/orders", 201,
                 {"branchId": 1, "fulfillmentType": "DELIVERY", "deliveryAddress": "12 Flower Road, Colombo 07",
                  "items": [{"menuItemId": burger["menuId"], "quantity": 1}, {"menuItemId": pizza["menuId"], "quantity": 1}]},
                 token=customer, check=lambda p: (p["deliveryFee"] == 300, f"grandTotal={p['grandTotal']} incl. Rs. 300 delivery"))
    oid, total = order["id"], order["grandTotal"]
    item_id = order["items"][0]["id"]
    step("Customer edits a quantity before paying", "PATCH", f"/api/orders/{oid}/items/{item_id}", 200, {"quantity": 2}, token=customer,
         check=lambda p: (p["grandTotal"] > total, f"grandTotal {total} → {p['grandTotal']}"))
    total = call("GET", f"/api/orders/{oid}", token=customer)[1]["grandTotal"]
    step("Another customer cannot read this order", "GET", f"/api/orders/{oid}", 403, token=other_customer)
    h, b = pay(oid, "CASH_ON_DELIVERY", token=customer)
    step("Customer chooses cash on delivery", "POST", f"/api/orders/{oid}/payment", 200, b, token=customer, headers=h,
         check=lambda p: (p["status"] == "PLACED" and p["awaitingAcceptance"] and p["paymentStatus"] == "PENDING",
                          "status=PLACED, awaitingAcceptance=true, paymentStatus=PENDING"))
    step("Items are locked once payment is chosen", "PATCH", f"/api/orders/{oid}/items/{item_id}", 409, {"quantity": 3}, token=customer)
    step("Staff accepts", "POST", f"/api/orders/{oid}/accept", 200, token=staff)
    step("Staff starts preparing", "PUT", f"/api/orders/{oid}/status", 200, {"status": "PREPARING"}, token=staff)
    riders = step("Staff lists branch riders with availability", "GET", "/api/orders/riders", 200, token=staff,
                  check=lambda p: (len(p) > 0, ", ".join(f"{r['name']} ({'busy' if r['busy'] else 'free'})" for r in p)))
    rider_id = rider_info["id"]
    step("Dispatch without a rider is refused", "PUT", f"/api/orders/{oid}/status", 400, {"status": "OUT_FOR_DELIVERY"}, token=staff)
    step("Staff dispatches to the rider", "PUT", f"/api/orders/{oid}/status", 200, {"status": "OUT_FOR_DELIVERY", "riderId": rider_id},
         token=staff, check=lambda p: (p["riderName"] is not None, f"rider={p['riderName']}"))
    step("Customer sees live tracking", "GET", f"/api/orders/{oid}/tracking", 200, token=customer,
         check=lambda p: (p["riderId"] == rider_id, f"stage={p['stage']}, eta={p['etaMinutes']} min, rider={p['riderName']}"))
    step("COD order cannot be completed before cash is collected", "PUT", f"/api/orders/{oid}/status", 409, {"status": "COMPLETED"}, token=rider)
    step("Rider cannot record less cash than the total", "POST", f"/api/orders/{oid}/cod/collect", 422, {"cashCollected": 100}, token=rider)
    cash = float(int(total // 1000 + 1) * 1000)
    step(f"Rider records Rs. {cash:.0f} cash; change is calculated", "POST", f"/api/orders/{oid}/cod/collect", 200,
         {"cashCollected": cash}, token=rider,
         check=lambda p: (abs(p["changeGiven"] - round(cash - total, 2)) < 0.01 and p["status"] == "DELIVERED",
                          f"status=DELIVERED, paymentStatus={p['paymentStatus']}, change Rs. {p['changeGiven']}"))
    step("Rider completes the order", "PUT", f"/api/orders/{oid}/status", 200, {"status": "COMPLETED"}, token=rider)
    step("Rating outside 1–5 is rejected", "POST", f"/api/orders/{oid}/review", 400, {"rating": 9}, token=customer)
    step("Customer reviews the order", "POST", f"/api/orders/{oid}/review", 201, {"rating": 5, "comment": "Hot and on time"}, token=customer)
    step("A second review is refused", "POST", f"/api/orders/{oid}/review", 409, {"rating": 4}, token=customer)
    step("Customer files a complaint", "POST", f"/api/orders/{oid}/complaints", 201,
         {"category": "MISSING_ITEM", "description": "The garlic dip was missing from the bag"}, token=customer)
    step("Manager sees the complaint (read-only)", "GET", "/api/orders/complaints", 200, token=manager,
         check=lambda p: (any(c["orderId"] == oid for c in p), "complaint listed for the branch"))

    # ------------------------------------------------------------------ TC-04
    scenario("TC-04", "Cancellation request after acceptance, approved by staff with refund",
             "Once the kitchen has accepted, the customer must ask; staff approval cancels and refunds the card.")
    order = step("Customer places takeaway order", "POST", "/api/orders", 201,
                 {"branchId": 1, "fulfillmentType": "TAKEAWAY", "items": [{"menuItemId": burger["menuId"], "quantity": 1}]}, token=customer)
    oid = order["id"]
    h, b = pay(oid, "DEBIT_CARD", token=customer, card_number="4242424242424242")
    step("Customer pays by debit card", "POST", f"/api/orders/{oid}/payment", 200, b, token=customer, headers=h)
    step("Staff accepts", "POST", f"/api/orders/{oid}/accept", 200, token=staff)
    step("Direct cancel is no longer allowed", "POST", f"/api/orders/{oid}/cancel", 409, token=customer)
    step("Customer requests cancellation", "POST", f"/api/orders/{oid}/cancel-request", 200, {"reason": "Ordered twice by mistake"},
         token=customer, check=lambda p: (p["cancelRequestStatus"] == "PENDING", "cancelRequestStatus=PENDING"))
    step("Kitchen is blocked while the request is pending", "PUT", f"/api/orders/{oid}/status", 409, {"status": "PREPARING"}, token=staff)
    step("Request appears in the staff queue", "GET", "/api/orders/cancel-requests", 200, token=staff,
         check=lambda p: (any(o["id"] == oid for o in p), "listed"))
    step("Staff approves; order cancelled and refunded", "POST", f"/api/orders/{oid}/cancel-request/approve", 200,
         {"note": "No problem"}, token=staff,
         check=lambda p: (p["status"] == "CANCELLED" and p["paymentStatus"] == "REFUNDED",
                          f"status={p['status']}, paymentStatus={p['paymentStatus']}, refundStatus={p['refundStatus']}"))

    # ------------------------------------------------------------------ TC-05
    scenario("TC-05", "Declined cancellation request lets the kitchen continue",
             "Staff can decline a late cancellation with a note; the order then proceeds normally.")
    order = step("Customer places takeaway order", "POST", "/api/orders", 201,
                 {"branchId": 1, "fulfillmentType": "TAKEAWAY", "items": [{"menuItemId": pizza["menuId"], "quantity": 1}]}, token=customer)
    oid = order["id"]
    h, b = pay(oid, "CREDIT_CARD", token=customer, card_number="4242424242424242")
    step("Customer pays by card", "POST", f"/api/orders/{oid}/payment", 200, b, token=customer, headers=h)
    step("Staff accepts", "POST", f"/api/orders/{oid}/accept", 200, token=staff)
    step("Customer requests cancellation", "POST", f"/api/orders/{oid}/cancel-request", 200, {"reason": "Taking too long"}, token=customer)
    step("Staff declines with a note", "POST", f"/api/orders/{oid}/cancel-request/decline", 200, {"note": "Already in the oven"},
         token=staff, check=lambda p: (p["cancelRequestStatus"] == "DECLINED", "cancelRequestStatus=DECLINED"))
    step("Kitchen continues", "PUT", f"/api/orders/{oid}/status", 200, {"status": "PREPARING"}, token=staff,
         check=lambda p: (p["status"] == "PREPARING", "status=PREPARING"))
    step("A second request is refused", "POST", f"/api/orders/{oid}/cancel-request", 409, {"reason": "Again"}, token=customer)

    # ------------------------------------------------------------------ TC-06
    scenario("TC-06", "Staff rejects an incoming paid order",
             "Rejection needs a reason and refunds the card automatically.")
    order = step("Guest places takeaway order", "POST", "/api/orders", 201,
                 {"branchId": 1, "fulfillmentType": "TAKEAWAY", "guestName": "Live Guest Two", "guestPhone": "0771234567",
                  "items": [{"menuItemId": pizza["menuId"], "quantity": 1}]})
    oid, gtok = order["id"], order["guestToken"]
    h, b = pay(oid, "CREDIT_CARD", guest=gtok, card_number="4242424242424242")
    step("Guest pays by card", "POST", f"/api/orders/{oid}/payment", 200, b, headers=h)
    step("Rejection without a reason is refused", "POST", f"/api/orders/{oid}/reject", 400, {"reason": ""}, token=staff)
    step("Staff rejects: kitchen closing", "POST", f"/api/orders/{oid}/reject", 200, {"reason": "Kitchen closing early"}, token=staff,
         check=lambda p: (p["status"] == "CANCELLED" and p["paymentStatus"] == "REFUNDED" and p["cancellationReason"] == "REJECTED_BY_BRANCH",
                          f"status={p['status']}, paymentStatus={p['paymentStatus']}, reason={p['cancellationReason']}"))
    step("Guest can still read the outcome with their token", "GET", f"/api/orders/{oid}", 200, headers={"X-Guest-Token": gtok},
         check=lambda p: (p["status"] == "CANCELLED", "status=CANCELLED"))

    # ------------------------------------------------------------------ TC-07
    scenario("TC-07", "Three declined cards cancel the order",
             "The payment attempt limit voids the order after the third decline.")
    order = step("Customer places takeaway order", "POST", "/api/orders", 201,
                 {"branchId": 1, "fulfillmentType": "TAKEAWAY", "items": [{"menuItemId": pizza["menuId"], "quantity": 1}]}, token=customer)
    oid = order["id"]
    for attempt, number, code in [(1, "4000000000000002", 402), (2, "4000000000009995", 402), (3, "4000000000000069", 402)]:
        h, b = pay(oid, "CREDIT_CARD", token=customer, card_number=number)
        step(f"Decline #{attempt} ({number[-4:]})", "POST", f"/api/orders/{oid}/payment", code, b, token=customer, headers=h,
             check=lambda p: (True, f"{p['error']} / {p['declineCode']}, attemptsRemaining={p['attemptsRemaining']}"))
    step("Order is cancelled with payment voided", "GET", f"/api/orders/{oid}", 200, token=customer,
         check=lambda p: (p["status"] == "CANCELLED" and p["paymentStatus"] == "VOIDED",
                          f"status={p['status']}, paymentStatus={p['paymentStatus']}, reason={p['cancellationReason']}"))

    # ------------------------------------------------------------------ TC-08
    scenario("TC-08", "Role and access rules",
             "Only the right people can see or move an order.")
    order = step("Guest places takeaway order", "POST", "/api/orders", 201,
                 {"branchId": 1, "fulfillmentType": "TAKEAWAY", "guestName": "Live Guest Three", "guestPhone": "0771234567",
                  "items": [{"menuItemId": pizza["menuId"], "quantity": 1}]})
    oid, gtok = order["id"], order["guestToken"]
    step("Listing orders anonymously is denied", "GET", "/api/orders", 401)
    step("Wrong guest token is denied", "GET", f"/api/orders/{oid}", 401, headers={"X-Guest-Token": "not-the-token"})
    step("Staff/admin accounts cannot place customer orders", "POST", "/api/orders", 403,
         {"branchId": 1, "fulfillmentType": "TAKEAWAY", "items": [{"menuItemId": pizza["menuId"], "quantity": 1}]}, token=staff)
    step("Rider not assigned to the order cannot see it", "GET", f"/api/orders/{oid}", 403, token=rider)
    step("Branch manager can view it (read-only)", "GET", f"/api/orders/{oid}", 200, token=manager)
    step("Super Admin can view it", "GET", f"/api/orders/{oid}", 200, token=admin)
    step("Guest cancels before acceptance (nothing charged)", "POST", f"/api/orders/{oid}/cancel", 200,
         headers={"X-Guest-Token": gtok},
         check=lambda p: (p["status"] == "CANCELLED" and p["paymentStatus"] == "VOIDED", f"status={p['status']}, paymentStatus={p['paymentStatus']}"))

    with open("live_results.json", "w") as fh:
        json.dump({"started": run_started.isoformat(timespec="seconds"), "finished": datetime.now().isoformat(timespec="seconds"),
                   "customer": cust_email, "scenarios": RESULTS}, fh, indent=2)
    total = sum(len(s["steps"]) for s in RESULTS)
    passed = sum(1 for s in RESULTS for st in s["steps"] if st["ok"])
    print(f"\n{passed}/{total} steps passed")


if __name__ == "__main__":
    main()
