# Page Specification — Ressource List

> Functional and layout specification for the Resource list page. Full CRUD with multi-select referential import.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Ressource List |
| Route | `/ressources` |
| Page Type | List |
| Parent Page | None |
| Access Roles | All roles (PO, CP, Manager) |
| Status | Implemented |

---

## 2. Purpose

List all resources with full CRUD operations and the ability to import multiple resources from an external referential. Provides a searchable, sortable table with column customization and Excel export.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Navbar | Click "Ressources" | Any page |
| Breadcrumb | Click "Ressources" | Ressource detail page |
| Direct URL | Navigate to `/ressources` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Row click | `/ressources/[id]` (Resource detail) |

---

## 4. Layout

### 4.1 Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Ressources                     [+ Creer] [Import] [Export]  │
├──────────────────────────────────────────────────────────────┤
│  [Search...]                                    [Settings]   │
├──────────────────────────────────────────────────────────────┤
│  Nom       | Email              | Equipe  | Regime  | Orig  │
│  ──────────┼────────────────────┼─────────┼─────────┼────── │
│  Dupont J. | jean@airbus.com    | Frontend| 100%    | CREA  │
│  Martin M. | marie@airbus.com   | Backend | 80%     | IMPO  │
│  Durand P. | pierre@airbus.com  | DevOps  | 100%    | CREA  │
│  ...       | ...                | ...     | ...     | ...   │
├──────────────────────────────────────────────────────────────┤
│  Rows per page: [10 v]                    Page 1 of 3   < > │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | "Ressources" |
| Subtitle | None |
| Actions | "+ Creer" button, "Import" button, "Export" button |

### 4.3 Tabs (if Detail Page)

Not applicable (List page).

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/ressources | All resources | -- |
| 1 | GET /api/referential/resources | Referential resources (for import modal) | -- |

- **Parallel calls**: Both calls run in parallel via Promise.all.

### 5.2 Refresh Strategy

- **After create/update/delete**: Full refetch of ressources list.
- **Loading behavior on refetch**: No spinner (initialLoadDone ref prevents remount).

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Filtered list | Client-side search filter on nom/email | ressources + search input |
| Import candidates | Referential resources not yet imported | referential - existing ressources (by email uniqueness) |

---

## 6. Content Zones

### 6.1 Zone: Resource Table

**Type**: Table (DataTable)

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Nom | ressource.nom + prenom | Yes | Full name display |
| Email | ressource.email | Yes | -- |
| Equipe | ressource.equipe | Yes | Team name |
| Regime Travail | ressource.regimeTravail | Yes | Percentage display |
| Origine | ressource.origine | Yes | CREATED / IMPORTED badge |
| Actions | -- | No | Edit + Delete icons |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Row click | Click anywhere on row (except actions) | Navigate to `/ressources/[id]` |
| Sort | Click column header | Toggle asc/desc |
| Search | Type in search bar | Client-side filter on nom/email |
| Create | Click [+ Creer] button | Open resource CRUD modal (create) |
| Edit | Click pencil icon | Open resource CRUD modal (edit) |
| Delete | Click trash icon | Open confirm delete modal |
| Import | Click [Import] button | Open import modal |
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

### 7.1 CRUD Modal — Resource

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Prenom | Text input | Yes | Min 1 char | -- |
| Nom | Text input | Yes | Min 1 char | -- |
| Email | Text input | Yes | Valid email format, unique | Email uniqueness validated |
| Equipe | Text input | No | -- | Team name |
| Regime Travail | Number | No | 0-100 | Working percentage |
| Pourcentage Temps Travail | Number | No | 0-100 | -- |

**Behavior**:
- Create mode: empty form, title "Creer une Ressource"
- Edit mode: pre-filled, title "Modifier la Ressource"
- Validation: Zod schema, inline field errors. Email uniqueness checked.
- On save: POST or PUT /api/ressources -> close modal -> refresh -> toast
- On error: 409 -> email uniqueness conflict message

### 7.2 Confirm Delete Modal

- **Message**: "Are you sure you want to delete {ressource.nom}?"

### 7.3 Import Modal

| Element | Description |
|---------|-------------|
| Search input | Filter referential resources by name/email |
| Dropdown list | Filterable list of available referential resources |
| Selected chips | Visual chips showing selected resources (multi-select) |
| Import button | Imports all selected resources |

**Behavior**:
- Search filters the referential dropdown.
- Click on a resource adds it to the selected chips.
- Click chip "x" removes from selection.
- Import button: POST /api/ressources for each selected resource (origine=IMPORTED, keeps referential UUID).
- On complete: close modal -> refresh list -> success toast.

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loading (refetch) | Data refresh after mutation | No spinner, silent refresh |
| Empty | No resources exist | "No data found" message |
| Empty search | Search yields no results | "No results match your search" |
| Error | API call fails | Toast notification (auto) |

---

## 9. Business Rules Applied

No specific business rules apply to the resource list page.

---

## 10. Table Settings

| Setting | Default | Persisted |
|---------|---------|-----------|
| Rows per page | 10 | localStorage (atom_table_ressources) |
| Visible columns | All except ID | localStorage |
| Column order | Nom, Email, Equipe, RegimeTravail, Origine, Actions | localStorage |
| Sort | Nom ascending | No (session only) |

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| ressources | page.title | "Ressources" |
| ressources | columns.* | "Nom", "Email", "Equipe" |
| ressources | actions.create | "Creer une Ressource" |
| ressources | actions.import | "Importer" |
| enums | origine.* | "CREATED", "IMPORTED" |
| common | actions.* | "Save", "Cancel", "Delete" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Ressource Detail | Child (row click navigation) |
| Dashboard Ressources | Cross-link (Manager capacity view) |
