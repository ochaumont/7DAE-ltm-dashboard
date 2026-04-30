# Page Specification — Release Detail

> Functional and layout specification for the Release detail page. Livrables table with assignment management.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Release Detail |
| Route | `/produits/[id]/releases/[releaseId]` |
| Page Type | Detail |
| Parent Page | Produit Detail (`/produits/[id]`) |
| Access Roles | PO |
| Status | Implemented |

---

## 2. Purpose

Display release details with its livrables table and assignment management. Shows release progress (weighted by effort) and allows full CRUD on livrables. Each livrable can have resource affectations managed via a dedicated modal with RG-02 validation (total <= 100%).

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Release row click | Click release in Produit Detail ReleasesTab | `/produits/[id]` |
| Direct URL | Navigate to `/produits/[id]/releases/[releaseId]` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Breadcrumb "Produits" | `/produits` |
| Breadcrumb product name | `/produits/[id]` |

---

## 4. Layout

### 4.1 Page Structure

```
┌──────────────────────────────────────────────────────────────┐
│  Breadcrumb: Produits > Product Name > Release Name          │
│  Release Name                            [Edit] [Delete]     │
│  Status badge     Progress: ██████████░░░ 65%                │
├──────────────────────────────────────────────────────────────┤
│  [Search...]                  [+ Livrable] [Export] [Gear]   │
├──────────────────────────────────────────────────────────────┤
│  Nom | Desc | Debut | Livraison | Charge | Progress | Statut│
│  ────┼──────┼───────┼───────────┼────────┼──────────┼───────│
│  L1  | ...  | 03/01 | 04/15     | 10j    | 80%      | EN_CO │
│  L2  | ...  | 03/15 | 05/01     | 5j     | 40%      | A_FAI │
│  ... | ...  | ...   | ...       | ...    | ...      | ...   │
├──────────────────────────────────────────────────────────────┤
│  Rows per page: [10 v]                     Page 1 of 2  < > │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | Release name (`release.nom`) |
| Subtitle | Release status badge + version + progress bar (weighted by effort) |
| Actions | Edit button, Delete button |

### 4.3 Tabs (if Detail Page)

Not applicable (single-view detail page, no tabs).

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/produits/{id}/releases | All releases (to find current release) | -- |
| 1 | GET /api/ressources | All resources (for affectation modal) | -- |
| 2 | GET /api/releases/{releaseId}/livrables | Livrables for this release | -- |
| 2 | GET /api/livrables/{id}/affectations (for each livrable) | Affectations per livrable | Livrable IDs from call 2 |

- **Parallel calls**: Release and resources fetched in parallel (order 1). Livrables fetched next, then affectations for each in parallel.
- **Sequential calls**: Affectation fetches depend on livrable IDs.

### 5.2 Refresh Strategy

- **After create/update/delete**: Full refetch of livrables + affectations.
- **Loading behavior on refetch**: No spinner (initialLoadDone ref prevents remount).

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Release progress | Weighted average: sum(livrable.progress * estimationCharge) / sum(estimationCharge) | Livrables with progress + estimationCharge |
| Affectation total per livrable | Sum of pourcentage across all affectations | Affectations per livrable |
| Resource name resolution | Map resource ID to display name | Resources list + affectation.ressourceId |

---

## 6. Content Zones

### 6.1 Zone: Release Header

**Type**: Custom (header with progress bar)

**Data displayed**:

| Field | Source | Notes |
|-------|--------|-------|
| Release name | release.nom | -- |
| Version | release.version | -- |
| Status | release.statut | Badge component |
| Progress bar | Computed weighted average | Percentage display |
| Delivery date (planned) | release.dateLivraisonPrevue | -- |
| Delivery date (actual) | release.dateLivraisonReelle | Only if LIVREE |

### 6.2 Zone: Livrables Table

**Type**: Table (DataTable)

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Nom | livrable.nom | Yes | -- |
| Description | livrable.description | Yes | Truncated |
| Date Debut | livrable.dateDebut | Yes | Date format |
| Date Livraison | livrable.dateLivraison | Yes | Date format |
| Estimation Charge | livrable.estimationCharge | Yes | In days |
| Progress | livrable.progress | Yes | Progress bar |
| Statut | livrable.statut | Yes | Badge component |
| Priorite | livrable.priorite | Yes | Badge component |
| Actions | -- | No | Assign + Edit + Delete icons |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Sort | Click column header | Toggle asc/desc |
| Search | Type in search bar | Client-side filter on nom/description |
| Create | Click [+ Livrable] button | Open LivrableModal (create mode) |
| Edit | Click pencil icon | Open LivrableModal (edit mode) |
| Delete | Click trash icon | Open confirm delete modal |
| Assign | Click assign icon | Open AffectationModal |
| Export | Click export button | Download Excel file |
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

### 7.1 CRUD Modal — LivrableModal

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Description | Textarea | No | -- | -- |
| DateDebut | Date picker | No | Before dateLivraison | -- |
| DateLivraison | Date picker | No | After dateDebut | -- |
| EstimationCharge | Number | No | >= 0 | In days |
| Progress | Number | No | 0-100 | Percentage slider or input |
| Statut | Select | Yes | -- | StatutLivrable enum |
| Priorite | Select | No | -- | Priority enum |

**Behavior**:
- Create mode: empty form, title "Creer un Livrable"
- Edit mode: pre-filled, title "Modifier le Livrable"
- Validation: Zod schema, inline field errors
- On save: POST or PUT /api/releases/{releaseId}/livrables -> close modal -> refresh -> toast
- On error: global interceptor toast

### 7.2 Confirm Delete Modal

- **Message**: "Are you sure you want to delete {livrable.nom}?"
- **Note**: Deleting a livrable also removes its affectations.

### 7.3 AffectationModal

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Ressource | Select (Combobox) | Yes | -- | From /api/ressources |
| Pourcentage | Number input | Yes | 1-100 | -- |

**Behavior**:
- Displays existing affectations for the livrable as a list.
- Add new: select resource + percentage -> POST /api/livrables/{id}/affectations.
- Remove: click remove icon -> DELETE.
- **RG-02 validation**: Total affectation percentage across all resources must not exceed 100%. Save button disabled if exceeded. Warning message displayed.
- On error: 409 -> specific conflict message.

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loading (refetch) | Data refresh after mutation | No spinner, silent refresh |
| Release not found | Invalid releaseId | Error state / redirect |
| Empty livrables | No livrables in release | "No livrables" empty state |
| Error | API call fails | Toast notification (auto) |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| RG-02 | Affectation total <= 100% per livrable | AffectationModal blocks save if total exceeds 100%, shows warning |
| RG-07 | Release LIVREE requires all livrables TERMINE/ANNULE | Status change to LIVREE blocked if any livrable is not TERMINE/ANNULE |

---

## 10. Table Settings

| Setting | Default | Persisted |
|---------|---------|-----------|
| Rows per page | 10 | localStorage |
| Visible columns | All except ID | localStorage |
| Column order | Nom, Desc, Debut, Livraison, Charge, Progress, Statut, Priorite, Actions | localStorage |
| Sort | Nom ascending | No (session only) |

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| releases | detail.title | Release name (dynamic) |
| releases | columns.* | "Nom", "Date Debut", "Statut" |
| releases | actions.* | "Creer un Livrable", "Affecter" |
| produits | breadcrumb.* | Product name in breadcrumb |
| enums | statutLivrable.* | Livrable status labels |
| enums | priorite.* | Priority labels |
| common | actions.* | "Save", "Cancel", "Delete" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Produit Detail | Parent (breadcrumb) |
| Produit List | Grandparent (breadcrumb) |
| Ressource Detail | Cross-link (affectation resource) |
