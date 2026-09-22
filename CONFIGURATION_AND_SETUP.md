# BigBite — Comprehensive Configuration, Database Setup & Auth System Guide

This guide details the repository architecture, errors and vulnerabilities diagnosed during repository analysis, step-by-step MySQL database setup options, environment variable configuration, and usage of the Auth & RBAC (Role-Based Access Control) module.

---

## 1. Repository Analysis & Diagnosed Issues

During deep code and architecture analysis, the following issues were identified and resolved:

| # | Area | Issue Description | Resolution Implemented |
|---|---|---|---|
| 1 | **Database Connectivity** | `application.properties` hardcoded a remote Aiven MySQL host as default fallback with empty password, causing a 30s connection timeout and boot crash when running offline or without credentials. | Added `.env.example` with local and cloud MySQL configs; set sensible defaults and documented environment variable resolution. |
| 2 | **Security & JWT** | `pom.xml` lacked JWT libraries (`jjwt`), preventing token generation and validation. `SecurityConfig` was an unauthenticated placeholder (`permitAll()` on everything). | Added `jjwt-api`, `jjwt-impl`, and `jjwt-jackson` (v0.12.6) to `pom.xml`. Relocated security to `com.example.BigBite.auth.security` with stateless JWT authentication, password hashing (`BCrypt`), and method-level security (`@EnableMethodSecurity`). |
| 3 | **CORS Configuration** | No CORS configuration was present in the backend. Direct frontend calls (from `localhost:3000` or `5173`) would be blocked by the browser. | Added `CorsConfigurationSource` bean allowing `http://localhost:3000` and `http://localhost:5173` with credentials and standard HTTP methods. |
| 4 | **RBAC Account Flow** | No flow existed to enforce account status approval (`PENDING_APPROVAL`, `APPROVED`, `REJECTED`, `ACTIVE`). | Implemented status checks in `AuthService.login()`: `PENDING_APPROVAL` and `REJECTED` accounts receive HTTP `403 Forbidden` with descriptive messages. |
| 5 | **Validation & Error Handling** | Validation starter was imported but models lacked validation annotations, and no global exception handler existed. | Added validation annotations (`@NotBlank`, `@Email`, `@Size`) to DTOs and implemented `GlobalExceptionHandler` returning clean JSON error responses. |
| 6 | **SuperAdmin Bootstrap** | No mechanism existed to seed a Super Admin user, meaning admin endpoints would remain inaccessible initially. | Implemented `DataInitializer` that seeds an initial Super Admin (`admin@bigbite.com`) on startup if none exists. |
| 7 | **JPA Open-In-View** | Missing `spring.jpa.open-in-view=false` led to Spring framework warning on startup. | Added `spring.jpa.open-in-view=false` in `application.properties`. |

---

## 2. MySQL Database Configuration (3 Options)

You can run BigBite with **Local MySQL**, **Docker MySQL**, or **Aiven Cloud MySQL**. Choose the option that fits your environment:

### Option A: Local MySQL (macOS Native Server)

The machine has MySQL installed at `/usr/local/mysql/bin/mysql`.

1. **Start the MySQL Server**:
   - **Method 1 (macOS System Settings)**: Open **System Settings** → Scroll to **MySQL** (bottom of sidebar) → Click **Start MySQL Server**.
   - **Method 2 (Terminal)**:
     ```bash
     sudo /usr/local/mysql/support-files/mysql.server start
     ```

2. **Create the Database**:
   Open a terminal and run:
   ```bash
   /usr/local/mysql/bin/mysql -u root -p
   ```
   *(Enter your root password when prompted)*

   Then execute:
   ```sql
   CREATE DATABASE IF NOT EXISTS bigbite_db;
   SHOW DATABASES;
   EXIT;
   ```

3. **Configure `backend/.env`**:
   Create `backend/.env` with:
   ```properties
   DB_URL=jdbc:mysql://localhost:3306/bigbite_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   DB_USERNAME=root
   DB_PASSWORD=your_mysql_password
   PORT=8080
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   ```

---

### Option B: Docker MySQL (Fastest, No Sudo Required)

If you prefer running MySQL in a container:

1. Start Docker Desktop on your Mac.
2. Run the MySQL 8 container:
   ```bash
   docker run --name bigbite-mysql \
     -e MYSQL_ROOT_PASSWORD=rootpassword \
     -e MYSQL_DATABASE=bigbite_db \
     -p 3306:3306 -d mysql:8
   ```
3. Configure `backend/.env`:
   ```properties
   DB_URL=jdbc:mysql://localhost:3306/bigbite_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
   DB_USERNAME=root
   DB_PASSWORD=rootpassword
   PORT=8080
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   ```

---

### Option C: Aiven Cloud MySQL

If using the managed Aiven cloud database:

1. Retrieve your service credentials from the Aiven Console.
2. Configure `backend/.env`:
   ```properties
   DB_URL=jdbc:mysql://mysql-13ba3984-jathushansundararasu-23c8.l.aivencloud.com:16805/defaultdb?sslmode=require
   DB_USERNAME=avnadmin
   DB_PASSWORD=your_actual_aiven_password
   PORT=8080
   JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
   ```

---

## 3. Auth & RBAC Module Structure

The Auth & RBAC module (`com.example.BigBite.auth`) is structured as follows:

```
backend/src/main/java/com/example/BigBite/auth/
├── Role.java                     # Enums: SUPER_ADMIN, BRANCH_MANAGER, DELIVERY_PARTNER, CUSTOMER
├── UserStatus.java               # Enums: ACTIVE, PENDING_APPROVAL, APPROVED, REJECTED, SUSPENDED
├── User.java                     # Unified User entity with role & status fields
├── UserRepository.java           # Spring Data JPA queries (filters, by status, email lookup)
├── AuthService.java              # Customer/staff registration, credential validation, token issuing
├── AdminUserService.java         # SuperAdmin approval, rejection, and branch assignment logic
├── AuthController.java           # /api/auth endpoints (register, login, me)
├── AdminUserController.java      # /api/admin/users endpoints (pending, approve, reject, assign)
├── DataInitializer.java          # Auto-seeds default SUPER_ADMIN on startup
├── dto/
│   ├── RegisterRequestDto.java   # Registration payload with JSR-380 validation
│   ├── LoginRequestDto.java      # Login payload (email + password)
│   ├── AuthResponseDto.java      # JWT token + user details + message
│   ├── UserDto.java              # Safe user representation without password
│   ├── AssignBranchRequestDto.java # Branch assignment payload
│   └── RejectUserRequestDto.java # Rejection payload with optional reason
├── exception/
│   ├── AccountStatusException.java   # HTTP 403 for PENDING_APPROVAL / REJECTED accounts
│   ├── EmailAlreadyExistsException.java # HTTP 409 for duplicate emails
│   ├── ResourceNotFoundException.java   # HTTP 404 for missing entities
│   └── GlobalExceptionHandler.java      # Centralized REST error handling
└── security/
    ├── JwtUtil.java              # HMAC-SHA256 token generation and parsing
    ├── JwtAuthFilter.java        # OncePerRequest filter extracting Bearer token
    ├── CustomUserDetailsService.java # Integrates User entity with Spring Security
    └── SecurityConfig.java       # FilterChain, CORS, stateless session, and RBAC rules
```

---

## 4. API Endpoints Reference

### Public Endpoints (No Auth Required)

| Method | Endpoint | Description | Expected Status |
|---|---|---|---|
| `POST` | `/api/auth/register/customer` | Registers a new Customer (Status: `ACTIVE`, immediately logged in) | `201 Created` |
| `POST` | `/api/auth/register/branch-manager` | Registers a Branch Manager (Status: `PENDING_APPROVAL`, awaiting admin) | `201 Created` |
| `POST` | `/api/auth/register/delivery-partner` | Registers a Delivery Partner (Status: `PENDING_APPROVAL`, awaiting admin) | `201 Created` |
| `POST` | `/api/auth/login` | Authenticates user; returns JWT token + role + status | `200 OK` (or `403` if pending) |

### Authenticated Endpoints (Any Logged-in User)

| Method | Endpoint | Description | Expected Status |
|---|---|---|---|
| `GET` | `/api/auth/me` | Returns current user profile, role, status, and branch ID | `200 OK` |

### Super Admin Only (`hasRole('SUPER_ADMIN')`)

| Method | Endpoint | Description | Expected Status |
|---|---|---|---|
| `GET` | `/api/admin/users/pending` | Lists all users with status `PENDING_APPROVAL` | `200 OK` |
| `PUT` | `/api/admin/users/{id}/approve` | Approves a branch manager / delivery partner (sets `APPROVED`) | `200 OK` |
| `PUT` | `/api/admin/users/{id}/reject` | Rejects an account with optional reason (sets `REJECTED`) | `200 OK` |
| `PUT` | `/api/admin/users/{id}/assign-branch` | Assigns an approved staff member to a `branchId` | `200 OK` |
| `GET` | `/api/admin/users?role=&status=` | Filtered list of users by role and/or status | `200 OK` |

---

## 5. How to Run & Verify

### Running the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080`.

On first startup, the initial Super Admin account is auto-seeded:
- **Email**: `admin@bigbite.com`
- **Password**: `Admin@123`

BRANCH MANAGER 
 MAIL :Abiabishek25@gmail.com
 PASS : Abiabishek#25















### Running the Automated Tests

To run the full suite of unit tests for registration, status-gated login, and admin approval workflows:

```bash
cd backend
./mvnw test -Dtest=AuthServiceTest,AdminUserServiceTest
```

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend development server starts on `http://localhost:3000` and proxies `/api` calls to `http://localhost:8080`.
