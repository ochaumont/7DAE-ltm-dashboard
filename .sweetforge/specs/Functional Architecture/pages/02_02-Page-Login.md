# Page Specification — Login

> Functional and layout specification for the Login page. Describes what the page displays, how data is loaded, and how the user interacts with each zone.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Login |
| Route | `/login` |
| Page Type | Form |
| Parent Page | None |
| Access Roles | Unauthenticated users only |
| Status | Implemented |

---

## 2. Purpose

Authenticate users via an email and password form. In demo mode, hardcoded user accounts are available for quick access. On successful login, the user is redirected to their role-specific landing page (PO to /produits, CP to /projets, Manager to /dashboard/projets).

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Direct URL | Navigate to `/login` | Any unauthenticated state |
| Auth redirect | Automatic redirect when accessing protected route | Any protected page |
| Root redirect | `/` redirects to `/login` if not authenticated | Application root |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Successful login (PO) | `/produits` |
| Successful login (CP) | `/projets` |
| Successful login (Manager) | `/dashboard/projets` |

---

## 4. Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────┐
│                                             │
│         ┌───────────────────────┐           │
│         │     Application Logo  │           │
│         ├───────────────────────┤           │
│         │  Email                │           │
│         │  ┌─────────────────┐  │           │
│         │  │                 │  │           │
│         │  └─────────────────┘  │           │
│         │  Password             │           │
│         │  ┌─────────────────┐  │           │
│         │  │                 │  │           │
│         │  └─────────────────┘  │           │
│         │                       │           │
│         │  [Error message area] │           │
│         │                       │           │
│         │  [    Se connecter   ]│           │
│         └───────────────────────┘           │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | Application logo / name |
| Subtitle | None |
| Actions | None |

### 4.3 Tabs (if Detail Page)

Not applicable (Form page).

---

## 5. Data Loading

### 5.1 API Calls on Mount

No API calls on page mount. This is a static form page.

### 5.2 Refresh Strategy

Not applicable.

### 5.3 Derived / Computed Data

None.

---

## 6. Content Zones

### 6.1 Zone: Login Form

**Type**: Form

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Email | User input | No | Text input, type="email" |
| Password | User input | No | Text input, type="password" |
| Error message | API response | No | Displayed below form fields on failed login |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Submit | Click "Se connecter" or press Enter | POST /api/auth/login with email+password |
| Login success | 200 response | Store user in AuthContext + localStorage, fetch user preferences, redirect by role |
| Login failure | 401 response | Display inline error message |

**Features**:
- [x] Form validation (email required, password required)
- [x] Error message display on failed login
- [x] Role-based redirect on success

---

## 7. Modals & Dialogs

None.

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Default | Page loaded | Empty form, submit button enabled |
| Submitting | Login request in flight | Submit button disabled / loading indicator |
| Error | Invalid credentials | Error message displayed below form fields |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| Role-based redirect | User role determines landing page | PO -> /produits, CP -> /projets, Manager -> /dashboard/projets |

---

## 10. Table Settings

Not applicable (no tables on this page).

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| common | login.title | "Login" |
| common | login.email | "Email" |
| common | login.password | "Password" |
| common | login.submit | "Se connecter" |
| common | login.error | "Invalid credentials" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Produit List | Landing page for PO role |
| Projet List | Landing page for CP role |
| Dashboard Projets | Landing page for Manager role |
