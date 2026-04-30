# Page Specification — Ressource Detail

> Functional and layout specification for the Resource detail page. 4-tab view with profile, leave periods, workload, and capacity.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Ressource Detail |
| Route | `/ressources/[id]` |
| Page Type | Detail |
| Parent Page | Ressource List (`/ressources`) |
| Access Roles | All roles (PO, CP, Manager) |
| Status | Implemented |

---

## 2. Purpose

Display comprehensive resource details with 4 tabs: profile management, leave period tracking, workload overview, and 12-month rolling capacity view. Unlike other detail pages, the edit/delete modals are inside the ProfileTab (not in the parent header).

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Row click | Click a resource row in Ressource List | `/ressources` |
| Resource click | Click resource name in Dashboard Ressources | `/dashboard/ressources` |
| Direct URL | Navigate to `/ressources/[id]` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Breadcrumb "Ressources" | `/ressources` |

---

## 4. Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  Breadcrumb: Ressources > Resource Name                 │
│  Resource Name (Prenom Nom)                             │
├─────────────────────────────────────────────────────────┤
│  [Profile] [Conges] [Charge] [Capacite]                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tab Content Area                                       │
│  (varies by active tab)                                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | Resource full name (`prenom nom`) |
| Subtitle | None |
| Actions | None in parent (edit/delete are in ProfileTab) |

### 4.3 Tabs

| Tab | Label | Content Summary | Lines |
|-----|-------|-----------------|-------|
| 1 | Profile | Resource info display + edit/delete modals | 221 |
| 2 | Conges | Leave period table + CRUD | 220 |
| 3 | Charge | Read-only workload table (lazy-loaded) | 84 |
| 4 | Capacite | 12-month rolling capacity table (RG-03) | 82 |

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/ressources/{id} | Resource details | -- |
| 1 | GET /api/ressources/{id}/conges | Leave periods | -- |

- **Parallel calls**: Both calls run in parallel via Promise.all.
- **Lazy loading**: ChargeTab data is loaded only when the Charge tab is activated (not on mount).

### 5.2 Refresh Strategy

- **After create/update/delete**: Refetch resource + conges data.
- **Loading behavior on refetch**: No spinner (initialLoadDone ref prevents remount).

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Capacity table | 12-month rolling capacity per month using RG-03 formula | Resource (regimeTravail, pourcentageTempsTravail) + conges |
| Leave overlap detection | Check for overlapping leave periods on save | Existing conges + new conge dates |

---

## 6. Content Zones

### 6.1 Zone: ProfileTab (221 lines)

**Type**: Form / Display

**Data displayed**:

| Field | Source | Notes |
|-------|--------|-------|
| Prenom | ressource.prenom | Read-only display (edit via modal) |
| Nom | ressource.nom | Read-only display |
| Email | ressource.email | Read-only display |
| Equipe | ressource.equipe | Read-only display |
| Regime Travail | ressource.regimeTravail | Percentage display |
| Pourcentage Temps Travail | ressource.pourcentageTempsTravail | Percentage display |
| Origine | ressource.origine | CREATED / IMPORTED badge |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Edit | Click [Edit] button | Open edit modal (in ProfileTab, not parent) |
| Delete | Click [Delete] button | Open confirm delete modal (in ProfileTab) |

**Note**: Unlike other detail pages, edit/delete modals live inside the ProfileTab component, not in the parent page header.

### 6.2 Zone: CongesTab (220 lines)

**Type**: Table (DataTable) with CRUD

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Date Debut | conge.dateDebut | Yes | Date format |
| Date Fin | conge.dateFin | Yes | Date format |
| Motif | conge.motif | Yes | Leave reason |
| Actions | -- | No | Edit + Delete icons |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Create | Click [+ Conge] button | Open conge CRUD modal (create) |
| Edit | Click pencil icon | Open conge CRUD modal (edit) |
| Delete | Click trash icon | Confirm delete modal |

### 6.3 Zone: ChargeTab (84 lines)

**Type**: Table (read-only workload table)

**Loading**: Lazy-loaded on tab activation (not loaded on page mount).

Displays workload distribution across projects/livrables for this resource. Read-only, no CRUD.

### 6.4 Zone: CapaciteTab (82 lines)

**Type**: Table (read-only capacity table)

**Data displayed**: Pre-computed 12-month rolling capacity table.

| Column / Field | Source | Notes |
|---------------|--------|-------|
| Month | Computed (current + 11 future months) | Month/Year label |
| Working Days | Calendar-based | Business days in month |
| Leave Days | From conges | Days of leave in that month |
| Available Capacity | RG-03 formula | workingDays x (pct/100) - leaveDays |

---

## 7. Modals & Dialogs

### 7.1 CRUD Modal — Resource Edit (in ProfileTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Prenom | Text input | Yes | Min 1 char | -- |
| Nom | Text input | Yes | Min 1 char | -- |
| Email | Text input | Yes | Valid email, unique | -- |
| Equipe | Text input | No | -- | -- |
| Regime Travail | Number | No | 0-100 | -- |
| Pourcentage Temps Travail | Number | No | 0-100 | -- |

**Behavior**:
- Pre-filled from existing resource.
- Validation: Zod schema, email uniqueness.
- On save: PUT /api/ressources/{id} -> close modal -> refresh -> toast.

### 7.2 Confirm Delete Modal (in ProfileTab)

- **Message**: "Are you sure you want to delete {ressource.nom}?"
- **On confirm**: DELETE /api/ressources/{id} -> navigate to /ressources.

### 7.3 CRUD Modal — Conge (in CongesTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Date Debut | Date picker | Yes | -- | -- |
| Date Fin | Date picker | Yes | After dateDebut | -- |
| Motif | Text input | No | -- | Leave reason |

**Behavior**:
- Create mode: empty form, title "Ajouter un Conge"
- Edit mode: pre-filled, title "Modifier le Conge"
- **Overlap validation**: Validates that new leave period does not overlap with existing periods.
- On save: POST or PUT /api/ressources/{id}/conges -> close modal -> refresh -> toast.

### 7.4 Confirm Delete Modal — Conge

- **Message**: "Are you sure you want to delete this leave period?"

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loading (refetch) | Data refresh after mutation | No spinner, silent refresh |
| Resource not found | Invalid resource ID | Error state / redirect |
| Empty conges | No leave periods | "No leave periods" empty state in CongesTab |
| Empty charge | No workload data | "No workload data" in ChargeTab |
| Error | API call fails | Toast notification (auto) |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| RG-03 | Monthly capacity formula: workingDays x (pct/100) - leaveDays | CapaciteTab computes and displays 12-month rolling capacity |

---

## 10. Table Settings

| Setting | Default | Persisted |
|---------|---------|-----------|
| Conges rows per page | 10 | localStorage |

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| ressources | detail.title | Resource name (dynamic) |
| ressources | tabs.* | "Profile", "Conges", "Charge", "Capacite" |
| ressources | profile.* | Profile field labels |
| ressources | conges.* | Leave period labels |
| ressources | charge.* | Workload labels |
| ressources | capacite.* | Capacity labels |
| enums | origine.* | "CREATED", "IMPORTED" |
| common | actions.* | "Save", "Cancel", "Delete", "Edit" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Ressource List | Parent (breadcrumb) |
| Dashboard Ressources | Cross-link (Manager capacity view) |
