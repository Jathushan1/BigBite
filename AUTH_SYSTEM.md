# BigBite — Auth & RBAC System (Aiven Setup)

Branch: `feature/auth-system` → merges into `main`
Status: implemented, pending review before merge

---

## 1. What's implemented

| Area | What it does |
|---|---|
| JWT auth | Stateless, HMAC-SHA256 (`jjwt` 0.12.6), token issued on login, validated per-request via `JwtAuthFilter` |
| Password storage | `BCrypt` hashing — no plaintext passwords stored |
| RBAC | 4 roles: `SUPER_ADMIN`, `BRANCH_MANAGER`, `DELIVERY_PARTNER`, `CUSTOMER`, enforced with `@EnableMethodSecurity` |
| Approval flow | `BRANCH_MANAGER` / `DELIVERY_PARTNER` register into `PENDING_APPROVAL`, blocked from login until a `SUPER_ADMIN` approves |
| CORS | Explicit `CorsConfigurationSource` allowing the frontend origin (`localhost:3000`), replacing the old `permitAll()` placeholder |
| Validation | `@NotBlank`, `@Email`, `@Size` on request DTOs |
| Error handling | `GlobalExceptionHandler` → clean JSON error bodies instead of raw stack traces |
| SuperAdmin bootstrap | `DataInitializer` seeds one `SUPER_ADMIN` on first startup if none exists |
| JPA warning fix | `spring.jpa.open-in-view=false` set |

---

## 2. Environment setup — Aiven only

`backend/.env`:
```properties
DB_URL=jdbc:mysql://mysql-13ba3984-jathushansundararasu-23c8.l.aivencloud.com:16805/defaultdb?sslmode=require
DB_USERNAME=avnadmin
DB_PASSWORD=<your_actual_aiven_password>
PORT=8080
JWT_SECRET=<generate your own — see note below>
```

**⚠️ Fix before merging: `JWT_SECRET` must not be a shared, committed value.**
The uploaded setup doc has the *same* `JWT_SECRET` hardcoded across all three DB options — if that exact string reaches `main` (even inside a doc, not code), it's effectively a leaked signing key: anyone with it can forge valid tokens for any role, including `SUPER_ADMIN`. Treat it exactly like `DB_PASSWORD`:
- It belongs only in `.env` (already gitignored)
- Each environment (local dev, eventual deploy) should have its own value
- Generate one per environment, e.g.: `openssl rand -hex 32`

**⚠️ Also fix: rotate the seeded SuperAdmin password.**
`DataInitializer` seeds `admin@bigbite.com` / `Admin@123` — fine for local dev, but log in and change it immediately on any shared/deployed instance, and don't let `Admin@123` sit as the permanent superadmin credential once real approval workflows are in use.

---

## 3. RBAC flow

```
CUSTOMER:          register → ACTIVE → log in immediately

BRANCH_MANAGER
DELIVERY_PARTNER:  register → PENDING_APPROVAL → login blocked (403)
                                     │
                          SUPER_ADMIN reviews
                                     │
                        ┌────────────┴────────────┐
                        ▼                          ▼
                    APPROVED                   REJECTED
                (can log in,               (login blocked,
                 then assign-branch)        reason shown)
```

## 4. Package structure

```
com.example.BigBite.auth/
├── Role.java / UserStatus.java        # enums
├── User.java / UserRepository.java
├── AuthService.java                   # register, login, status-gated auth
├── AdminUserService.java              # approve / reject / assign-branch
├── AuthController.java                # /api/auth/*
├── AdminUserController.java           # /api/admin/users/*
├── DataInitializer.java               # seeds SuperAdmin on boot
├── dto/                                # request/response DTOs, JSR-380 validated
├── exception/                          # AccountStatusException, EmailAlreadyExistsException,
│                                       #   ResourceNotFoundException, GlobalExceptionHandler
└── security/
    ├── JwtUtil.java
    ├── JwtAuthFilter.java
    ├── CustomUserDetailsService.java
    └── SecurityConfig.java
```

## 5. API reference

**Public**
| Method | Endpoint | Result |
|---|---|---|
| POST | `/api/auth/register/customer` | `201`, status `ACTIVE` |
| POST | `/api/auth/register/branch-manager` | `201`, status `PENDING_APPROVAL` |
| POST | `/api/auth/register/delivery-partner` | `201`, status `PENDING_APPROVAL` |
| POST | `/api/auth/login` | `200` + JWT, or `403` if pending/rejected |

**Authenticated**
| Method | Endpoint | Result |
|---|---|---|
| GET | `/api/auth/me` | `200`, current user + role + status + branchId |

**Super Admin only**
| Method | Endpoint | Result |
|---|---|---|
| GET | `/api/admin/users/pending` | `200`, list of pending accounts |
| PUT | `/api/admin/users/{id}/approve` | `200`, status → `APPROVED` |
| PUT | `/api/admin/users/{id}/reject` | `200`, status → `REJECTED` |
| PUT | `/api/admin/users/{id}/assign-branch` | `200`, sets `branchId` |
| GET | `/api/admin/users?role=&status=` | `200`, filtered list |

---

## 6. Running it

```bash
cd backend
./mvnw spring-boot:run       # → localhost:8080

cd frontend
npm install
npm run dev                  # → localhost:3000, proxies /api to :8080
```

## 7. Testing

**Automated:**
```bash
cd backend
./mvnw test -Dtest=AuthServiceTest,AdminUserServiceTest
```

**Manual verification flow (Postman/curl/Thunder Client) — confirms the actual RBAC gate works end to end:**

| Step | Request | Expect |
|---|---|---|
| 1 | `POST /api/auth/register/customer` with valid body | `201`, no approval needed |
| 2 | `POST /api/auth/login` with that customer's credentials | `200` + JWT |
| 3 | `POST /api/auth/register/branch-manager` with valid body | `201`, status `PENDING_APPROVAL` |
| 4 | `POST /api/auth/login` with that manager's credentials | `403` — blocked, not yet approved |
| 5 | `POST /api/auth/login` as `admin@bigbite.com` / seeded password | `200` + JWT (superadmin) |
| 6 | `GET /api/admin/users/pending` with superadmin token | `200`, the manager from step 3 appears |
| 7 | `PUT /api/admin/users/{id}/approve` with superadmin token | `200`, status → `APPROVED` |
| 8 | `POST /api/auth/login` again as the manager | `200` + JWT — now works |
| 9 | `PUT /api/admin/users/{id}/assign-branch` with a `branchId` | `200`, manager now tied to a branch |
| 10 | `GET /api/auth/me` with the manager's new token | `200`, shows `branchId` populated |
| 11 | Repeat 3–9 with a `delivery-partner` registration to confirm the same gate applies | same results |
| 12 | Attempt `GET /api/admin/users/pending` using a `CUSTOMER` token | `403` — role check enforced |

If all 12 pass, the RBAC gate is solid end-to-end.

---

## 8. Pre-merge checklist (before PR into `main`)

- [ ] `JWT_SECRET` removed from any committed file/doc — generated locally per environment only
- [ ] Seeded SuperAdmin password (`Admin@123`) changed on any shared/deployed instance, and not left as a permanent credential
- [ ] Confirm `backend/.env` is still gitignored (double-check it hasn't been accidentally staged)
- [ ] `AuthServiceTest` and `AdminUserServiceTest` passing
- [ ] Manual 12-step flow above run at least once against the real Aiven DB
- [ ] `SecurityConfig` reviewed — confirm no leftover `permitAll()` on anything beyond the intended public auth endpoints
- [ ] Team notified: once merged, everyone pulls `main` into their own `feature/*` branch to get real `customerId`/`role`/`branchId` instead of stubs
