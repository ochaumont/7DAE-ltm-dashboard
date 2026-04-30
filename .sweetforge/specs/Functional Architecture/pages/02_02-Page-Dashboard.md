# Page Specification — Dashboard (Redirect)

> Functional and layout specification for the Dashboard redirect page. This page contains no UI — it redirects based on user role.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Dashboard |
| Route | `/dashboard` |
| Page Type | Redirect |
| Parent Page | None |
| Access Roles | All authenticated roles |
| Status | Implemented |

---

## 2. Purpose

Act as a routing hub that redirects authenticated users to the appropriate dashboard sub-page based on their role. Manager users are sent to `/dashboard/projets`. Other roles are redirected to their default landing page.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Navbar | Click "Dashboard" | Any page |
| Direct URL | Navigate to `/dashboard` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Manager role | `/dashboard/projets` |
| Other roles | Role-specific landing page |

---

## 4. Layout

No visual layout. Immediate redirect on mount.

---

## 5. Data Loading

### 5.1 API Calls on Mount

None. Role is read from AuthContext (already loaded).

### 5.2 Refresh Strategy

Not applicable.

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Redirect target | Determine destination URL from user role | AuthContext.user.role |

---

## 6. Content Zones

None. This page renders nothing visible — it performs an immediate redirect via `router.push()`.

---

## 7. Modals & Dialogs

None.

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Redirecting | Always | Brief blank page or spinner during redirect |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| Role-based routing | User role determines dashboard variant | Manager -> /dashboard/projets |

---

## 10. Table Settings

Not applicable.

---

## 11. Internationalization

Not applicable (no visible text).

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Dashboard Projets | Redirect target for Manager |
| Dashboard Ressources | Sibling dashboard page |
| Dashboard Alertes | Sibling dashboard page |
