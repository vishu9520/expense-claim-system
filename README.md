# 💰 Expense Claim Management System (Role-Based Access)

A production-ready Full-Stack Expense Claim Management System built with **Spring Boot 3 (Java 17)**, **React (Vite + Tailwind CSS)**, and **MySQL**.

---

## 🌟 Key Features

### 🔐 1. Authentication & Role-Based Access Control (RBAC)
- **JWT Authentication** with dual-token architecture:
  - **Access Token** (short-lived, 15 minutes)
  - **Refresh Token** (long-lived, 7 days) stored in database with automatic rotation
- **Password Security**: Passwords hashed with **BCrypt**
- **Default Registration**: All new registrations default to the `EMPLOYEE` role
- **Pre-seeded Manager**: Dedicated seeded manager account (`manager@company.com`)
- **Strict Authorization**:
  - Backend `@PreAuthorize` / SecurityFilterChain method guards
  - Frontend React Router guards (`PrivateRoute`, `RoleRoute`) + dedicated **Access Denied (403)** page
  - Employees can only view and mutate their own claims; accessing another user's claim strictly returns `403 Forbidden`

### 👤 2. Employee Capabilities
- **Claim Management**: Create, view, edit, and delete expense claims
- **Locking Rules**: Editing and deleting claims are **strictly restricted to `PENDING` status**
- **Pagination & Search**: Server-side pagination, search by title/description, and status filtering
- **Receipt Upload**: Attach receipts (JPEG, PNG, PDF) up to 10MB with MIME-type and size validation
- **Employee Dashboard**: Real-time totals for:
  - 💰 Total Claimed
  - ✅ Total Approved
  - ❌ Total Rejected
  - ⏳ Total Pending

### 👔 3. Manager Capabilities
- **Universal Overview**: View all claims across the company with multi-dimensional filtering (by Status, Employee, and Date Range)
- **Claim Decision Workflow**:
  - Approve or Reject claims with a single click
  - **Mandatory comment** enforcement when rejecting a claim
  - Immutable state: Approved or Rejected claims cannot be modified or re-evaluated
- **Receipt Inspection**: Direct in-browser viewing and downloading of submitted receipts
- **Audit Log Timeline**: Interactive chronological history of who performed what action and when on every claim
- **Manager Dashboard**:
  - Status count KPIs (Pending, Approved, Rejected)
  - Expense totals broken down by category (Travel, Food, Accommodation, Office Supplies, Medical, Other)
  - Monthly summary breakdown (claims count and total spend) for current year
- **User Management**:
  - View all registered accounts
  - Activate or deactivate employees (deactivated accounts are strictly barred from logging in)
  - Built-in protection preventing deactivation of Manager accounts

### 🎁 4. Bonus Features
- 📑 **Swagger / OpenAPI 3.0 Documentation**: Complete interactive UI with Bearer JWT support
- 📊 **CSV Export**: Export filtered claims data into standard CSV format
- 🐳 **Docker Compose**: One-command containerization for MySQL, Backend, and Frontend

---

## 🔑 Sample Login Credentials

| Role | Full Name | Email | Password |
|---|---|---|---|
| **Manager** | Rajesh Sharma | `manager@company.com` | `Manager@123` |
| **Employee 1** | Ankit Verma | `ankit.verma@company.com` | `Employee@123` |
| **Employee 2** | Priya Mehta | `priya.mehta@company.com` | `Employee@123` |
| **Employee 3** | Rahul Singh | `rahul.singh@company.com` | `Employee@123` |
| **Employee 4** | Sneha Patel | `sneha.patel@company.com` | `Employee@123` |

*(Note: Passwords are encrypted with BCrypt hash cost 10)*

---

## 🛠️ Technology Stack & Architecture

- **Backend**:
  - Java 17
  - Spring Boot 3.2.5
  - Spring Security 6 & Spring Data JPA (Hibernate)
  - MySQL 8.0 Driver
  - JJWT (JSON Web Token) `0.12.3`
  - SpringDoc OpenAPI (Swagger UI) `2.3.0`
  - OpenCSV `5.8`
  - JUnit 5 & Mockito (7 Unit Tests)
- **Frontend**:
  - React 18 + Vite 5
  - React Router DOM 6
  - Axios with Automatic Token Refresh Interceptors
  - Tailwind CSS 3
- **DevOps**:
  - Docker & Docker Compose
  - Multi-stage Dockerfiles

---

## 🚀 Quick Setup & Installation

### Option A: Local Development (Recommended)

#### 1. Database Setup
1. Ensure MySQL server is running on `localhost:3306`.
2. Execute the provided setup script:
   - File: `expense_db_setup.sql`
   - Run in **MySQL Workbench** or command-line:
     ```bash
     mysql -u root -p < expense_db_setup.sql
     ```
   *(This creates `expense_db`, all tables, seeds the manager, 4 employees, 20 dummy claims, and 33 audit logs)*

#### 2. Start the Backend
1. Check `backend/src/main/resources/application.properties` and set your local MySQL Workbench root password:
   ```properties
   # Replace with your own local MySQL Workbench password
   spring.datasource.password=your_mysql_password
   ```
   *(Or pass it as an environment variable `DB_PASSWORD`)*
2. Navigate to `backend` and run:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
3. Backend starts at: `http://localhost:8080`
4. Swagger UI: `http://localhost:8080/swagger-ui/index.html`

#### 3. Start the Frontend
1. In a separate terminal, navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Frontend starts at: `http://localhost:5173`

---

### Option B: Run with Docker Compose

Run the entire stack (MySQL + Backend + Frontend) in isolated containers:

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8080`
- **Swagger Docs**: `http://localhost:8080/swagger-ui/index.html`

---

## 📚 API Endpoints Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user as Employee |
| `POST` | `/api/auth/login` | Public | Login with email & password, returns JWT pair |
| `POST` | `/api/auth/refresh?token={refToken}` | Public | Rotate and issue new access token |
| `POST` | `/api/auth/logout?token={refToken}` | Authenticated | Revoke refresh token |

### Employee Claims (`/api/employee/claims`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/employee/claims` | Employee | Create a new claim (status starts as PENDING) |
| `GET` | `/api/employee/claims` | Employee | List own claims (search, status filter, pagination) |
| `GET` | `/api/employee/claims/{id}` | Employee | Get single claim detail (403 if not owner) |
| `PUT` | `/api/employee/claims/{id}` | Employee | Edit claim (only allowed when PENDING) |
| `DELETE` | `/api/employee/claims/{id}` | Employee | Delete claim (only allowed when PENDING) |
| `POST` | `/api/employee/claims/{id}/receipt` | Employee | Upload receipt (JPEG, PNG, PDF <= 10MB) |

### Manager Claims (`/api/manager/claims`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/manager/claims` | Manager | View all company claims (status, employee, date range filter) |
| `GET` | `/api/manager/claims/{id}` | Manager | View any claim details |
| `PUT` | `/api/manager/claims/{id}/action` | Manager | Approve or Reject claim (comment mandatory for rejection) |
| `GET` | `/api/manager/claims/export/csv` | Manager | Export claims to CSV |

### Shared & Files
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/claims/{id}/audit-logs` | Authenticated | View audit trail timeline |
| `GET` | `/api/files/download/{claimId}` | Authenticated | View or download claim receipt |

### Dashboards (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/employee` | Employee | Claimed, Approved, Rejected & Pending totals |
| `GET` | `/api/dashboard/manager` | Manager | Status counts, Category totals & Monthly spend summary |

### User Management (`/api/manager/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/manager/users` | Manager | List all users |
| `GET` | `/api/manager/users/{id}` | Manager | Get user by ID |
| `PUT` | `/api/manager/users/{id}/activate` | Manager | Activate deactivated user |
| `PUT` | `/api/manager/users/{id}/deactivate` | Manager | Deactivate user (cannot login) |

---

## 🧪 Unit Testing

Unit tests are written using **JUnit 5** and **Mockito** covering business rules:
- Unauthorized access prevention (403 / AccessDeniedException)
- Rejection validation requiring comments
- Modification lock on non-pending claims
- Existing email registration blocking
- Token generation and auth response mapping

Run tests with:
```bash
cd backend
mvn test
```
**Results: 7 Tests run, 0 Failures, 0 Errors.**

---

## 🛡️ Security & Architecture Checklist Met

- [x] Layered Architecture: `Controller` → `Service` → `Repository` with clean DTO mapping
- [x] Global Exception Handler with `@RestControllerAdvice` returning standard HTTP status codes (`400`, `401`, `403`, `404`, `413`, `500`)
- [x] Request Validation using `@Valid`, `@NotBlank`, `@Size`, `@DecimalMin`, `@PastOrPresent`
- [x] Axios Interceptor auto-refreshing expired tokens and logging out on invalid session
- [x] Route Guards, Dynamic Navbars, and Role-Based UI elements

