# BigBite

Welcome to **BigBite** — a modern full-stack food ordering platform built with Spring Boot and React.

## 📁 Repository Structure

```
BigBite/
├── backend/    # Java 21 / Spring Boot REST API Service
└── frontend/   # React + TypeScript + Vite + Tailwind CSS Application
```

---

## 🚀 Getting Started

### 1. Backend Setup (Java / Spring Boot)

```bash
cd backend
# Edit .env with your Aiven MySQL connection details:
# DB_URL=jdbc:mysql://<AIVEN_HOST>:<AIVEN_PORT>/<DATABASE_NAME>?sslMode=REQUIRED
# DB_USERNAME=avnadmin
# DB_PASSWORD=<AIVEN_PASSWORD>

./mvnw spring-boot:run
```
The backend API server runs by default on `http://localhost:8080`.

### 2. Frontend Setup (React + Tailwind CSS)

```bash
cd frontend
npm install
npm run dev
```
The React frontend development server runs on `http://localhost:3000` with API calls automatically proxied to `http://localhost:8080/api`.

---

## 🛠 Tech Stack

- **Backend**: Java 21, Spring Boot 4.x, Spring Data JPA, Spring Security, MySQL Connector
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
