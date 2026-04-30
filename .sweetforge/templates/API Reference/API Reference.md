# API Reference — API Catalog

> Complete reference of all REST API endpoints: routes, methods, request/response formats, status codes, and validation rules.

---

## 1. Overview

### 1.1 API Summary

| Field | Value |
|-------|-------|
| Base URL | _e.g. http://localhost:8080/api_ |
| Protocol | _REST over HTTP_ |
| Content-Type | _application/json_ |
| Authentication | _e.g. None (simulated) / Bearer token_ |
| Documentation | _e.g. Swagger UI at /swagger-ui.html_ |

### 1.2 Endpoint Count

| Domain | Controllers | Endpoints |
|--------|------------|-----------|
| _e.g. Products_ | _2_ | _12_ |
| _e.g. Projects_ | _5_ | _25_ |
| _e.g. Resources_ | _2_ | _10_ |
| _e.g. Auth_ | _1_ | _2_ |
| _e.g. Settings_ | _1_ | _3_ |
| _e.g. Referential_ | _1_ | _2_ |
| **Total** | _e.g. 22_ | _e.g. 60+_ |

### 1.3 Standard Conventions

| Method | Pattern | Status Code | Description |
|--------|---------|-------------|-------------|
| GET | /entities | 200 | List all |
| GET | /entities/{id} | 200 / 404 | Get by ID |
| POST | /entities | 201 | Create (returns created entity) |
| PUT | /entities/{id} | 200 | Full update (returns updated entity) |
| DELETE | /entities/{id} | 204 | Delete (no content) |

### 1.4 Error Response Format

```json
{
  "timestamp": "2026-03-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed: name must not be blank",
  "path": "/api/entities"
}
```

| Status | Exception | Meaning |
|--------|-----------|---------|
| 400 | _ValidationException_ | _Invalid input data_ |
| 404 | _NoSuchElementException_ | _Entity not found_ |
| 409 | _HasChildrenException_ | _Cannot delete: has dependent entities_ |

---

## 2. Endpoints by Domain

### 2.1 [Domain Name]

<!-- Repeat this section for each domain / controller group -->

#### Controller: [Controller Name]

**Base path**: _e.g. /api/produits_

---

##### GET /api/entities

| Field | Value |
|-------|-------|
| **Description** | _List all entities_ |
| **Auth required** | _e.g. No_ |
| **Query params** | _None_ |

**Response**: `200 OK`

```json
[
  {
    "id": "...",
    "name": "...",
    "status": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

##### GET /api/entities/{id}

| Field | Value |
|-------|-------|
| **Description** | _Get entity by ID_ |
| **Path params** | `id` (UUID) |

**Response**: `200 OK` — single entity object

**Error**: `404 Not Found` — entity does not exist

---

##### POST /api/entities

| Field | Value |
|-------|-------|
| **Description** | _Create new entity_ |

**Request body:**

```json
{
  "name": "string (required)",
  "type": "ENUM_VALUE (required)",
  "description": "string (optional)"
}
```

**Validation rules:**

| Field | Rule | Error |
|-------|------|-------|
| _name_ | _Not blank_ | _400: "name must not be blank"_ |
| _type_ | _Valid enum value_ | _400: "invalid type"_ |

**Response**: `201 Created` — returns created entity with generated ID

---

##### PUT /api/entities/{id}

| Field | Value |
|-------|-------|
| **Description** | _Update entity_ |
| **Path params** | `id` (UUID) |

**Request body**: Same as POST

**Response**: `200 OK` — returns updated entity

**Error**: `404 Not Found`

---

##### DELETE /api/entities/{id}

| Field | Value |
|-------|-------|
| **Description** | _Delete entity_ |
| **Path params** | `id` (UUID) |

**Response**: `204 No Content`

**Error**: `409 Conflict` — entity has dependent children

---

### 2.2 Nested Resource Endpoints

<!-- For endpoints under a parent resource -->

#### Controller: [Parent].[Child] Controller

**Base path**: _e.g. /api/parents/{parentId}/children_

---

##### GET /api/parents/{parentId}/children

| Field | Value |
|-------|-------|
| **Description** | _List children of a parent_ |
| **Path params** | `parentId` (UUID) |

**Response**: `200 OK` — array of child entities

---

##### POST /api/parents/{parentId}/children

| Field | Value |
|-------|-------|
| **Description** | _Create child under parent_ |
| **Path params** | `parentId` (UUID) |

**Note**: _parentId is automatically set from the URL path, not the body_

---

<!-- REPEAT for each domain group -->

---

## 3. Special Endpoints

### 3.1 Authentication

##### POST /api/auth/login

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response**: `200 OK`
```json
{
  "token": "...",
  "user": { ... }
}
```

##### GET /api/auth/me

**Response**: `200 OK` — current user object

---

### 3.2 Referential (Read-only)

##### GET /api/referential/products

**Response**: `200 OK` — array of external products (for import)

##### GET /api/referential/resources

**Response**: `200 OK` — array of external resources (for import)

---

### 3.3 Settings

##### GET /api/settings/user-roles

**Response**: `200 OK` — array of user roles

##### POST /api/settings/user-roles

**Response**: `201 Created`

##### DELETE /api/settings/user-roles/{id}

**Response**: `204 No Content`

---

### 3.4 Bulk Operations

<!-- Any endpoints that handle multiple items at once -->

##### PUT /api/entities/{id}/assignments

| Field | Value |
|-------|-------|
| **Description** | _Bulk replace assignments_ |
| **Behavior** | _Deletes existing + creates new (all-or-nothing)_ |

**Request:**
```json
[
  { "resourceId": "...", "percentage": 50 },
  { "resourceId": "...", "percentage": 50 }
]
```

**Validation**: _e.g. Total percentage must equal 100%_

---

## 4. Complete Endpoint Index

<!-- Quick-reference table of all endpoints -->

| # | Method | Path | Description | Status Codes |
|---|--------|------|-------------|-------------|
| 1 | GET | /api/produits | List products | 200 |
| 2 | GET | /api/produits/{id} | Get product | 200, 404 |
| 3 | POST | /api/produits | Create product | 201, 400 |
| 4 | PUT | /api/produits/{id} | Update product | 200, 400, 404 |
| 5 | DELETE | /api/produits/{id} | Delete product | 204, 409 |
| ... | ... | ... | ... | ... |
