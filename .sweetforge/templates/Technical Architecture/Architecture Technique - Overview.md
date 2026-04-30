# Technical Architecture — Overview

> High-level view of the application architecture: system components, interactions between frontend and backend, domain model, and cross-cutting concerns.

---

## 1. System Overview

### 1.1 Purpose

<!-- One-paragraph description of what the application does -->

### 1.2 Architecture Diagram

<!-- ASCII diagram or link to an image showing the main components and their interactions -->

```
┌─────────────┐       HTTP/REST        ┌─────────────┐       ┌─────────────┐
│   Frontend   │ ◄──────────────────► │   Backend    │ ◄───► │  Storage    │
│  (Browser)   │    JSON over HTTP      │  (API Server)│       │  (DB/Files) │
└─────────────┘                        └─────────────┘       └─────────────┘
       │                                      │
       ▼                                      ▼
  localStorage                          Data files / DB
  (preferences)                         (persistence)
```

### 1.3 Key Design Decisions

<!-- List the most impactful architectural choices and their rationale -->

| Decision | Choice | Rationale |
|----------|--------|-----------|
| _e.g. Monorepo_ | _Frontend + Backend in one repo_ | _Simplified development workflow_ |
| _e.g. No database_ | _In-memory + JSON files_ | _Prototype / demo phase_ |
| _e.g. Client-side only_ | _No SSR_ | _Pervasive interactivity_ |

---

## 2. Tech Stack Summary

### 2.1 Backend

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | | |
| Framework | | |
| Build tool | | |
| Persistence | | |

> _Detailed in [01_02 — Backend Architecture](01_02-Architecture%20Technique%20-%20Backend.md)_

### 2.2 Frontend

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | | |
| Language | | |
| Styling | | |
| HTTP Client | | |

> _Detailed in [01_03 — Frontend Architecture](01_03-Architecture%20Technique%20-%20Frontend.md)_

---

## 3. Frontend ↔ Backend Interaction

### 3.1 Communication Protocol

- **Protocol**: _e.g. REST over HTTP (JSON)_
- **Base URL**: _e.g. http://localhost:8080/api_
- **Authentication**: _e.g. Session cookie / Bearer token / simulated_
- **Content-Type**: _e.g. application/json_

### 3.2 API Contract

<!-- How the API contract is defined and maintained -->

- **Documentation**: _e.g. Swagger UI at /swagger-ui.html (auto-generated from annotations)_
- **Versioning**: _e.g. No versioning / URL-based (v1) / header-based_
- **Schema sharing**: _e.g. Frontend types manually mirror backend entities_

### 3.3 Data Flow Patterns

<!-- Describe how data flows between frontend and backend -->

```
e.g.
[User action] → Frontend (API call) → Backend Controller → Service → Repository
                                                                      ↓
[UI update]   ← Frontend (state)   ← JSON response    ←──────────────┘
```

**Typical read flow:**
<!-- e.g. Page mount → useEffect → API function → Axios GET → setState → render -->

**Typical write flow:**
<!-- e.g. Form submit → validate (Zod) → API function → Axios POST → refetch → update UI -->

### 3.4 Error Propagation

<!-- How errors travel from backend to user -->

| Backend | HTTP | Frontend | User sees |
|---------|------|----------|-----------|
| _ValidationException_ | _400_ | _Axios interceptor_ | _Toast with message_ |
| _NotFoundException_ | _404_ | _Axios interceptor_ | _Toast "Not found"_ |
| _HasChildrenException_ | _409_ | _Specific catch block_ | _Custom error modal/message_ |

### 3.5 CORS Configuration

| Setting | Value |
|---------|-------|
| Allowed origins | _e.g. http://localhost:3000_ |
| Allowed methods | _e.g. All (GET, POST, PUT, DELETE, PATCH)_ |
| Credentials | _e.g. Enabled_ |

---

## 4. Domain Model

### 4.1 Entity Relationship Diagram

<!-- ASCII or link to an image showing the main entities and their relationships -->

```
e.g.
EntityA (1) ──► (N) EntityB (1) ──► (N) EntityC
EntityD (M) ◄──────► (N) EntityC  (via JoinEntity)
EntityE (1) ──► (N) EntityF
```

### 4.2 Entity Summary

| Entity | Description | Key Fields |
|--------|-------------|------------|
| _e.g. Product_ | _A deliverable product_ | _name, type, status_ |
| _e.g. Release_ | _A product release_ | _version, targetDate, status_ |

### 4.3 Base Entity

<!-- Describe the common base for all entities -->

```
e.g.
BaseEntity
├── id: UUID (auto-generated)
├── createdAt: DateTime
└── updatedAt: DateTime
```

### 4.4 Enums

<!-- List the main enums and their values -->

| Enum | Values | Used By |
|------|--------|---------|
| _e.g. Status_ | _DRAFT, ACTIVE, CLOSED_ | _Project, Release_ |

---

## 5. Authentication & Authorization

### 5.1 Auth Flow

<!-- Describe the authentication mechanism end-to-end -->

```
e.g.
1. User submits email/password → POST /api/auth/login
2. Backend validates credentials → returns user object
3. Frontend stores user in localStorage + AuthContext
4. Subsequent requests: no token (simulated auth) / Bearer header
5. GET /api/auth/me to restore session on page reload
```

### 5.2 Role-Based Access

| Role | Default Landing Page | Permissions |
|------|---------------------|-------------|
| _e.g. Product Owner_ | _/products_ | _Full CRUD on products_ |
| _e.g. Project Manager_ | _/projects_ | _Full CRUD on projects_ |
| _e.g. Manager_ | _/dashboard_ | _Read-only dashboards_ |

### 5.3 Route Protection

<!-- How routes are protected: middleware, auth guards, redirect logic -->

---

## 6. Data Management

### 6.1 Data Initialization

<!-- How initial/seed data is loaded -->

- _e.g. JSON files in sweet-sweet-backend/data/ loaded at startup via @PostConstruct_
- _e.g. DataInitializer logs entity counts for integrity verification_

### 6.2 External Data Sources

<!-- Describe any external APIs or referential data -->

| Source | Endpoint | Purpose |
|--------|----------|---------|
| _e.g. Product referential_ | _GET /api/referential/products_ | _Import products from external system_ |
| _e.g. Resource referential_ | _GET /api/referential/resources_ | _Import resources from external system_ |

### 6.3 Data Origin Tracking

<!-- How imported vs manually created data is distinguished -->

- _e.g. `origine` field: IMPORTED (keeps referential UUID) vs CREATED (random UUID)_

---

## 7. Cross-Cutting Concerns

### 7.1 Logging

| Layer | Approach |
|-------|----------|
| Backend | _e.g. SLF4J + Logback, startup diagnostics_ |
| Frontend | _e.g. console.error in catch blocks_ |

### 7.2 Date & Time Handling

- **Backend**: _e.g. ISO 8601 serialization (Jackson config)_
- **Frontend**: _e.g. Strings (YYYY-MM-DD), date-fns for manipulation_
- **Timezone**: _e.g. UTC / local / not handled_

### 7.3 Internationalization

- **Languages**: _e.g. EN, FR, DE_
- **Coverage**: _e.g. Frontend only (UI labels), backend returns raw data_
- **Enum display**: _e.g. Frontend maps enum values to translated labels_

### 7.4 Export Capabilities

| Format | Scope | Library |
|--------|-------|---------|
| _e.g. Excel (.xlsx)_ | _List pages, dashboards_ | _xlsx_ |
| _e.g. PNG/SVG_ | _Diagrams, Gantt charts_ | _Custom (DiagramExporter)_ |

---

## 8. Development Environment

### 8.1 Repository Structure

```
/
├── backend/            # Backend application
├── frontend/           # Frontend application
├── _specifications/    # Technical & functional specs
├── _plans/             # Implementation plans
└── ...
```

### 8.2 Running Locally

| Component | Command | URL |
|-----------|---------|-----|
| Backend | _e.g. mvn spring-boot:run_ | _http://localhost:8080_ |
| Frontend | _e.g. npm run dev_ | _http://localhost:3000_ |
| API Docs | — | _http://localhost:8080/swagger-ui.html_ |

### 8.3 Prerequisites

| Tool | Version |
|------|---------|
| _e.g. Java_ | _21_ |
| _e.g. Node.js_ | _20+_ |
| _e.g. Maven_ | _3.9+_ |
| _e.g. npm_ | _10+_ |

---

## 9. Security & Constraints

### 9.1 Security Measures

| Measure | Status | Notes |
|---------|--------|-------|
| HTTPS | _e.g. No (dev only)_ | |
| CORS | _e.g. Restricted to localhost:3000_ | |
| Rate limiting | _e.g. None_ | |
| Input validation | _e.g. Backend: Bean Validation / Frontend: Zod_ | |
| XSS protection | _e.g. React auto-escaping_ | |

### 9.2 Known Limitations

<!-- List accepted limitations that should be addressed before production -->

- _e.g. No real authentication (simulated)_
- _e.g. No HTTPS_
- _e.g. In-memory storage (no database)_
- _e.g. No automated tests_
- _e.g. No CI/CD pipeline_

### 9.3 Production Readiness Checklist

<!-- What would need to change for production deployment -->

| Area | Current | Production Target |
|------|---------|-------------------|
| _Auth_ | _Simulated_ | _JWT / OAuth2_ |
| _Database_ | _In-memory + JSON_ | _PostgreSQL_ |
| _Hosting_ | _localhost_ | _Cloud / On-prem_ |
