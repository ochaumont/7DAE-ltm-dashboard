# Page Specification — Produit List

> Functional and layout specification for the Product list page. Full CRUD with referential import.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Produit List |
| Route | `/produits` |
| Page Type | List |
| Parent Page | None |
| Access Roles | PO |
| Status | Implemented |

---

## 2. Purpose

List all products (Produits) with full CRUD operations and the ability to import products from an external referential. Serves as the primary landing page for the PO role. Each row navigates to the product detail page.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Navbar | Click "Produits" | Any page (PO role) |
| Login redirect | Automatic after login | PO role |
| Breadcrumb | Click "Produits" | Produit detail page |
| Direct URL | Navigate to `/produits` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Row click | `/produits/[id]` (Product detail) |

---

## 4. Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Produits                       [+ Creer] [Import] [Export] │
├─────────────────────────────────────────────────────────────┤
│  [Search...]                              [Settings gear]   │
├─────────────────────────────────────────────────────────────┤
│  Nom | Type | Origine | Description | PM | Architect | Ref │
│  ────┼──────┼─────────┼─────────────┼────┼───────────┼──── │
│  P1  | SW   | CREATED | Lorem ipsum | JD | PM        | --  │
│  P2  | HW   | IMPORTED| Description | MM | AL        | EXT │
│  ... | ...  | ...     | ...         | .. | ...       | ... │
├─────────────────────────────────────────────────────────────┤
│  Rows per page: [10 v]                    Page 1 of 3  < > │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | "Produits" |
| Subtitle | None |
| Actions | "+ Creer" button, "Import" button, "Export" button |

### 4.3 Tabs (if Detail Page)

Not applicable (List page).

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/produits | All products | -- |
| 1 | GET /api/referential/products | Referential products (for import modal) | -- |

- **Parallel calls**: Both calls run in parallel via Promise.all.

### 5.2 Refresh Strategy

- **After create/update/delete**: Full refetch of produits list.
- **Loading behavior on refetch**: No spinner on refetch (initialLoadDone ref prevents remount).

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Filtered list | Client-side search filter on nom/description | produits + search input |
| Import candidates | Referential products not already imported | referential - existing produits (by externalReference) |

---

## 6. Content Zones

### 6.1 Zone: Product Table

**Type**: Table (DataTable)

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Nom | produit.nom | Yes | -- |
| Type | produit.type | Yes | Badge component |
| Origine | produit.origine | Yes | CREATED / IMPORTED badge |
| Description | produit.description | Yes | Truncated |
| Product Manager | produit.productManager | Yes | Display name |
| Architect | produit.architect | Yes | Display name |
| External Reference | produit.externalReference | Yes | Only for IMPORTED |
| Actions | -- | No | Edit + Delete icons |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Row click | Click anywhere on row (except actions) | Navigate to `/produits/[id]` |
| Sort | Click column header | Toggle asc/desc |
| Search | Type in search bar | Client-side filter |
| Create | Click [+ Creer] button | Open ProductFormModal (create mode) |
| Edit | Click pencil icon | Open ProductFormModal (edit mode) |
| Delete | Click trash icon | Open confirm delete modal |
| Import | Click [Import] button | Open ProductImportModal |
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

### 7.1 CRUD Modal — ProductFormModal

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Description | Textarea | No | -- | -- |
| Type | Select | Yes | -- | Options from product type enum |
| Product Manager | Text input | No | -- | -- |
| Architect | Text input | No | -- | -- |

**Behavior**:
- Create mode: empty form, title "Creer un Produit"
- Edit mode: pre-filled from existing product, title "Modifier le Produit"
- Validation: Zod schema, inline field errors
- On save: POST or PUT /api/produits -> close modal -> refresh data -> success toast
- On error: global interceptor toast

### 7.2 Confirm Delete Modal

- **Message**: "Are you sure you want to delete {produit.nom}?"
- **Cascade warning**: Deleting a product also deletes its releases and livrables.

### 7.3 ProductImportModal

| Element | Description |
|---------|-------------|
| Search input | Filter referential products by name |
| Product list | Selectable list of referential products not yet imported |
| Import button | Imports selected product(s) |

**Behavior**:
- Fetches referential products, filters out already-imported ones.
- On import: POST /api/produits with origine=IMPORTED and referential UUID -> close modal -> refresh list.

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loading (refetch) | Data refresh after mutation | No spinner, silent refresh |
| Empty | No products exist | "No data found" message |
| Empty search | Search yields no results | "No results match your search" |
| Error | API call fails | Toast notification (auto) |

---

## 9. Business Rules Applied

No specific business rules apply to the product list page.

---

## 10. Table Settings

| Setting | Default | Persisted |
|---------|---------|-----------|
| Rows per page | 10 | localStorage (atom_table_produits) |
| Visible columns | All except ID | localStorage |
| Column order | Nom, Type, Origine, Description, PM, Architect, Ref, Actions | localStorage |
| Sort | Nom ascending | No (session only) |

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| produits | page.title | "Produits" |
| produits | columns.* | "Nom", "Type", "Description" |
| produits | actions.create | "Creer un Produit" |
| produits | actions.import | "Importer" |
| enums | typeProduit.* | Product type labels |
| enums | origine.* | "CREATED", "IMPORTED" |
| common | actions.* | "Save", "Cancel", "Delete" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Produit Detail | Child (row click navigation) |
