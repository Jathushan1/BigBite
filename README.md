# BigBite

Food ordering platform for a pizza franchise: branches, menus, online orders with card or cash on delivery, branch staff workflow, riders, and franchise reporting.

- **Backend:** Spring Boot 4 (Java 21), Spring Security with JWT, JPA on MySQL (Aiven), H2 for tests.
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4, `motion` animations, `recharts`, `@dnd-kit`.

## Roles

| Role | What they do | Lands on |
|---|---|---|
| Super Admin | Create, edit, activate/deactivate and delete branches; approve branch managers; franchise reports | `/admin` |
| Branch Manager | Own branch details and hours, menu and availability, approve staff and riders, read-only live orders and sales | `/manager` |
| Branch Staff | Every order operation: accept/reject, kitchen board, dispatch, counter cash, cancel requests, refunds | `/staff` |
| Delivery Partner | Deliver assigned orders, collect cash, report failed deliveries | `/delivery/dashboard` |
| Customer / guest | Browse branches and menus, order, pay, track, review, complain | `/order` |

Staff and riders choose a branch when they register at `/register?mode=partner`; that branch's manager approves them.

## Run locally

1. Copy `backend/.env.example` to `backend/.env` and set `DB_PASSWORD` (Aiven MySQL).
2. Start the backend:
   ```sh
   cd backend && ./mvnw spring-boot:run
   ```
   On first start it converts any old MySQL `ENUM` columns to `VARCHAR`, seeds the Super Admin, and (with `APP_SEED_DEMO=true`, the default) seeds three demo branches, their menus and team accounts if there are no branches yet.
3. Start the frontend:
   ```sh
   cd frontend && npm install && npm run dev
   ```
   Open http://localhost:3000. `/api` is proxied to port 8080.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@bigbite.com | Admin@123 |
| Manager (Colombo) | manager.cmb03@bigbite.lk | Manager@123 |
| Staff (Colombo) | staff.cmb03@bigbite.lk | Staff@123 |
| Rider (Colombo) | rider.cmb03@bigbite.lk | Rider@123 |
| Customer | customer@bigbite.lk | Customer@123 |

Kandy (`kdy01`) and Galle (`gle01`) have the same accounts with their code in the email.

**Test cards (mock gateway):** `4242 4242 4242 4242` approves; `4000 0000 0000 0002` declines; `…9995` insufficient funds; `…0069` expired. Use any future expiry and any CVC.

**Password reset:** with `APP_MAIL_MOCK=true` (default) reset emails appear in the demo mailbox at http://localhost:3000/dev/outbox. Set `APP_MAIL_MOCK=false` and the `MAIL_*` variables to send real email over SMTP. The demo mailbox exposes reset links to anyone who can reach the server, so turn it off (`APP_MAIL_MOCK=false` or `APP_MAIL_OUTBOX_PUBLIC=false`) for anything beyond local demos.

## Theme

All colours, the corner radius and the font are CSS variables in [`frontend/src/styles/theme.css`](frontend/src/styles/theme.css) (light values under `:root`, dark values under `.dark`). Every component uses them through Tailwind classes such as `bg-primary`, `text-muted-foreground` and `text-success`, so editing a value in that one file restyles the whole app. Hover and pressed shades are derived from `--primary`.

The finalized theme is deliberately calm: neutral surfaces, one muted brick red for actions and highlights, no gradients or glows, and text contrast of at least 4.5:1. The sun/moon button in the navbar switches between light and dark.

## Tests

```sh
cd backend && ./mvnw test          # unit and HTTP integration tests on H2
cd frontend && npm run build       # type-check and production build
```

[`backend/api-tests/bigbite.http`](backend/api-tests/bigbite.http) walks the full flow (customer → card payment → staff → rider → review → reports → password reset) against a running server using the VS Code REST Client or IntelliJ HTTP Client.

## Modules

- `auth` – registration per role, login, JWT, approvals (admin for managers, managers for their team), forgot/reset/change password.
- `branch` – branch CRUD, public directory, manager's own branch, sales and monthly reports (fed automatically by completed orders).
- `menu` – menu items per branch with availability; public read, manager/admin write. Design patterns explained in [MENU_MODULE_DESIGN_PATTERNS.md](MENU_MODULE_DESIGN_PATTERNS.md).
- `order` – the order lifecycle; see [ORDER_MODULE_README.md](ORDER_MODULE_README.md). Delivery, inventory, promotions, reviews, complaints, payment and refund gateways are mocked behind interfaces in `order/external/` (mocks in `order/external/mock/`) until those modules exist. The module is laid out like the menu module: `controller/`, `service/`, `security/`, `entity/`, `enums/`, `repository/`, `exception/`, `dto/request/`, `dto/response/`, `event/`, `external/`.
- `common` – one JSON error format for every endpoint, email sending, rate limiting.
