# Page Specification — Projet List

> Functional and layout specification for the Project list page. Hierarchical tree table with project/work-package support.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Projet List |
| Route | `/projets` |
| Page Type | List |
| Parent Page | None |
| Access Roles | CP, Manager |
| Status | Implemented |

---

## 2. Purpose

List all projects and work packages in a hierarchical tree table (ProjetTreeTable). Supports expand/collapse of parent-child relationships, inline creation of child work packages, search (with automatic flat mode), and full CRUD operations. Serves as the primary landing page for the CP role.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Navbar | Click "Projets" | Any page (CP/Manager role) |
| Login redirect | Automatic after login | CP role |
| Breadcrumb | Click "Projets" | Projet detail page |
| Direct URL | Navigate to `/projets` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Row click | `/projets/[id]` (Project detail) |

---

## 4. Layout

### 4.1 Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Projets                                [+ Creer] [Export]   │
├──────────────────────────────────────────────────────────────┤
│  [Search...]                                    [Settings]   │
├──────────────────────────────────────────────────────────────┤
│  ▼ Projet Alpha          | CP: Jean  | ACTIF  | [+] [E] [D]│
│    ├─ WP-1 Frontend      | CP: Marie | EN_COU | [+] [E] [D]│
│    └─ WP-2 Backend       | CP: Paul  | EN_COU | [+] [E] [D]│
│  ▶ Projet Beta           | CP: Luc   | PLANIF | [+] [E] [D]│
│  ▼ Projet Gamma          | CP: Anne  | ACTIF  | [+] [E] [D]│
│    └─ WP-1 Integration   | CP: Marc  | A_FAIR | [+] [E] [D]│
├──────────────────────────────────────────────────────────────┤
│  Rows per page: [10 v]                    Page 1 of 2   < > │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | "Projets" |
| Subtitle | None |
| Actions | "+ Creer" button, "Export" button |

### 4.3 Tabs (if Detail Page)

Not applicable (List page).

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/projets | All projects (includes work packages) | -- |
| 1 | GET /api/ressources | All resources (for CP display names) | -- |

- **Parallel calls**: Both calls run in parallel via Promise.all.

### 5.2 Refresh Strategy

- **After create/update/delete**: Full refetch of projets list.
- **Loading behavior on refetch**: No spinner (initialLoadDone ref prevents remount).

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Tree structure | Build parent-child hierarchy from flat list using parentId | projets array |
| Flat mode list | Flatten tree when search is active | Tree structure + search filter |
| CP display names | Resolve resource IDs to names | projets.chefDeProjet + ressources |
| Filtered list | Search filter on nom | projets + search input |

---

## 6. Content Zones

### 6.1 Zone: Project Tree Table

**Type**: Tree (ProjetTreeTable — NOT a standard DataTable)

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Nom | projet.nom | Yes | Indented by hierarchy level, with expand/collapse toggle |
| Chef de Projet | projet.chefDeProjet | Yes | Resolved display name from ressources |
| Technical Leader | projet.technicalLeader | Yes | Resolved display name |
| Functional Leader | projet.functionalLeader | Yes | Resolved display name |
| Statut | projet.statut | Yes | Badge component, color-coded |
| Type | projet.type | Yes | PROJECT or WORK_PACKAGE |
| Actions | -- | No | [+] Add child, Edit, Delete icons |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Row click | Click anywhere on row (except actions) | Navigate to `/projets/[id]` |
| Expand/collapse | Click toggle arrow | Show/hide child work packages |
| Sort | Click column header | Toggle asc/desc |
| Search | Type in search bar | Client-side filter, sets flatMode=true (no tree hierarchy) |
| Create project | Click [+ Creer] button | Open CRUD modal (create mode, type=PROJECT) |
| Add work package | Click [+] icon on a row | Open CRUD modal (create mode, type=WORK_PACKAGE, parentId pre-filled) |
| Edit | Click pencil icon | Open CRUD modal (edit mode) |
| Delete | Click trash icon | Open confirm delete modal |
| Export | Click export button | Download Excel file via exportToExcel |
| Settings | Click gear icon | Open column settings popup |

**Features**:
- [x] Sortable columns
- [x] Pagination (configurable rows/page)
- [x] Search/filter
- [x] Column visibility/order settings
- [x] Excel export
- [ ] Drag & drop

---

## 7. Modals & Dialogs

### 7.1 CRUD Modal — Projet / Work Package

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Description | Textarea | No | -- | -- |
| Type | Select | Yes | -- | PROJECT or WORK_PACKAGE (pre-filled based on context) |
| Parent | Select | Conditional | -- | Required if type=WORK_PACKAGE. Auto-filled when adding child. |
| Statut | Select | Yes | -- | StatutProjet enum |
| Chef de Projet | Select (Combobox) | No | -- | From ressources |
| Technical Leader | Select (Combobox) | No | -- | From ressources |
| Functional Leader | Select (Combobox) | No | -- | From ressources |
| Date Debut | Date picker | No | -- | -- |
| Date Fin | Date picker | No | After dateDebut | -- |

**Behavior**:
- Create mode: empty form (or pre-filled parentId + type for child WP), title "Creer un Projet" / "Creer un Work Package"
- Edit mode: pre-filled from existing entity
- Validation: Zod schema, inline field errors
- On save: POST or PUT /api/projets -> close modal -> refresh -> toast
- On error: 409 -> specific conflict message (e.g., cannot delete project with children)

### 7.2 Confirm Delete Modal

- **Message**: "Are you sure you want to delete {projet.nom}?"
- **Blocked if**: Project has child work packages (409 response). Error message displayed.

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loading (refetch) | Data refresh after mutation | No spinner, silent refresh |
| Empty | No projects exist | "No projects found" message |
| Empty search | Search yields no results | "No results match your search" |
| Error | API call fails | Toast notification (auto) |
| Delete blocked | 409 conflict (has children) | Error toast with explanation |

---

## 9. Business Rules Applied

No specific business rules apply beyond the 409 conflict handling for cascade protection.

---

## 10. Table Settings

| Setting | Default | Persisted |
|---------|---------|-----------|
| Rows per page | 10 | localStorage (atom_table_projets) |
| Visible columns | All except ID | localStorage |
| Column order | Nom, CP, TL, FL, Statut, Type, Actions | localStorage |
| Sort | Nom ascending | No (session only) |

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| projets | page.title | "Projets" |
| projets | columns.* | "Nom", "Chef de Projet", "Statut" |
| projets | actions.create | "Creer un Projet" |
| projets | actions.addWp | "Ajouter un Work Package" |
| enums | statutProjet.* | Status labels |
| enums | typeProjet.* | "PROJECT", "WORK_PACKAGE" |
| common | actions.* | "Save", "Cancel", "Delete" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Projet Detail | Child (row click navigation) |
| Dashboard Projets | Cross-link (Manager view) |
