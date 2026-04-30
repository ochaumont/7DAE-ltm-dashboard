# Page Specification — Produit Detail

> Functional and layout specification for the Product detail page. Multi-tab view with releases, roadmap, and team management.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Produit Detail |
| Route | `/produits/[id]` |
| Page Type | Detail |
| Parent Page | Produit List (`/produits`) |
| Access Roles | PO |
| Status | Implemented |

---

## 2. Purpose

Display comprehensive product details with 5 tabs: overview, releases (with ReleaseGrid and drag-and-drop), roadmap (ProductGantt), risks, and team management. Serves as the central hub for managing a product's lifecycle, releases, and livrables.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Row click | Click a product row in Produit List | `/produits` |
| Breadcrumb | Click product name | Release detail or child pages |
| Direct URL | Navigate to `/produits/[id]` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Release row click | `/produits/[id]/releases/[releaseId]` |
| Breadcrumb "Produits" | `/produits` |

---

## 4. Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  Breadcrumb: Produits > Product Name                    │
│  Product Name               [Edit] [Delete]             │
│  Status badge                                           │
├─────────────────────────────────────────────────────────┤
│  [Overview] [Releases] [Roadmap] [Risks] [Team]        │
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
| Title | Product name (`produit.nom`) |
| Subtitle | Product type badge + origine badge |
| Actions | Edit button, Delete button (in parent, not tabs) |

### 4.3 Tabs

| Tab | Label | Content Summary |
|-----|-------|-----------------|
| 1 | Overview | Placeholder / product summary |
| 2 | Releases | ReleaseGrid with DnD, release + livrable CRUD, assignment modal (622 lines) |
| 3 | Roadmap | ProductGantt chart, drag-to-move/resize, view modes, export (131 lines) |
| 4 | Risks | Placeholder |
| 5 | Team | useTeamCRUD, Combobox resource add, role editing (194 lines) |

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/produits/{id} | Product details | -- |
| 1 | GET /api/produits/{id}/releases | Product releases | -- |
| 1 | GET /api/produits/{id}/team | Team members | -- |
| 1 | GET /api/settings/user-roles | Available roles for team | -- |
| 1 | GET /api/ressources | All resources (for assignment + team) | -- |
| 1 | GET /api/produits/{id}/assignments | Product assignments | -- |
| 2 | GET /api/releases/{releaseId}/livrables (for each release) | Livrables per release | Release IDs from call 1 |

- **Parallel calls**: All order-1 calls run in parallel via Promise.all.
- **Sequential calls**: Livrable fetches (order 2) depend on release IDs from order 1.

### 5.2 Refresh Strategy

- **After create/update/delete**: Full refetch of all data via shared fetchAll function.
- **Loading behavior on refetch**: No spinner (initialLoadDone ref prevents remount).

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Release-livrable tree | Hierarchical data for ReleaseGrid | Releases + livrables per release |
| Gantt tasks | Timeline items for ProductGantt | Releases + livrables with dates |
| Team role display | Role names resolved from roleIds | Team members + user-roles |

---

## 6. Content Zones

### 6.1 Zone: OverviewTab

**Type**: Custom (placeholder)

Basic product information display. Currently minimal implementation.

### 6.2 Zone: ReleasesTab (622 lines)

**Type**: Custom (ReleaseGrid component with drag-and-drop)

**Data displayed**: Hierarchical grid showing Release -> Livrable tree structure.

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Add release | Click [+ Release] | Open release CRUD modal (create) |
| Edit release | Click edit icon on release row | Open release CRUD modal (edit) |
| Delete release | Click delete icon | Confirm delete modal |
| Add livrable | Click [+] on release row | Open livrable CRUD modal |
| Edit livrable | Click edit icon on livrable row | Open livrable CRUD modal (edit) |
| Delete livrable | Click delete icon on livrable | Confirm delete modal |
| Assign | Click assign icon on livrable | Open assignment modal |
| Drag & drop | Drag livrable between releases | Move livrable to different release |
| Release row click | Click release name | Navigate to `/produits/[id]/releases/[releaseId]` |

**Business rules**: RG-07 (Release LIVREE requires all livrables TERMINE/ANNULE).

### 6.3 Zone: RoadmapTab (131 lines)

**Type**: Chart (ProductGantt)

**Note**: Dynamically imported with `{ ssr: false }` (gantt-task-react is not SSR-compatible).

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Drag to move | Drag a bar horizontally | Update start/end dates |
| Drag to resize | Drag bar edge | Update duration |
| View mode toggle | Click view mode buttons | Switch Day/Week/Month/Year |
| Export | Click export button | Export chart |

### 6.4 Zone: RisksTab

**Type**: Custom (placeholder)

Currently minimal implementation.

### 6.5 Zone: TeamTab (194 lines)

**Type**: Custom (team management)

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Add member | Select resource from Combobox | POST /api/produits/{id}/team |
| Edit roles | Click role badges on member | Toggle roles via PUT |
| Remove member | Click remove icon | DELETE /api/produits/{id}/team/{memberId} |

---

## 7. Modals & Dialogs

### 7.1 CRUD Modal — Product Edit (in parent header)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Description | Textarea | No | -- | -- |
| Type | Select | Yes | -- | Product type enum |
| Product Manager | Text input | No | -- | -- |
| Architect | Text input | No | -- | -- |

### 7.2 Confirm Delete Modal (in parent header)

- **Message**: "Are you sure you want to delete {produit.nom}?"
- **Cascade warning**: Deleting a product also deletes all its releases and livrables.
- **On confirm**: DELETE /api/produits/{id} -> navigate to /produits.

### 7.3 Release CRUD Modal (in ReleasesTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Version | Text input | No | -- | -- |
| Statut | Select | Yes | -- | StatutRelease enum |
| DateLivraisonPrevue | Date picker | No | -- | -- |
| DateLivraisonReelle | Date picker | No | -- | -- |
| Description | Textarea | No | -- | -- |

### 7.4 Livrable CRUD Modal (LivrableModal, in ReleasesTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Description | Textarea | No | -- | -- |
| DateDebut | Date picker | No | Before dateLivraison | -- |
| DateLivraison | Date picker | No | After dateDebut | -- |
| EstimationCharge | Number | No | >= 0 | In days |
| Statut | Select | Yes | -- | StatutLivrable enum |
| Priorite | Select | No | -- | Priority enum |

### 7.5 Assignment Modal (in ReleasesTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Ressource | Select | Yes | -- | From /api/ressources |
| Pourcentage | Number | Yes | 1-100, total <= 100% | RG-02 validated |

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loading (refetch) | Data refresh after mutation | No spinner, silent refresh |
| Product not found | Invalid product ID | Error state / redirect |
| Empty releases | No releases for product | "No releases" empty state in ReleasesTab |
| Error | API call fails | Toast notification (auto) |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| RG-02 | Affectation total <= 100% | Assignment modal blocks save if total exceeds 100% |
| RG-07 | Release LIVREE requires all livrables TERMINE/ANNULE | Status change blocked or warning in ReleasesTab |

---

## 10. Table Settings

Not applicable (uses ReleaseGrid component, not DataTable with useTableSettings).

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| produits | detail.title | Product name (dynamic) |
| produits | tabs.* | "Overview", "Releases", "Roadmap", "Risks", "Team" |
| produits | releases.* | Release-related labels |
| produits | livrables.* | Livrable-related labels |
| produits | team.* | Team-related labels |
| enums | statutRelease.* | Release status labels |
| enums | statutLivrable.* | Livrable status labels |
| common | actions.* | "Save", "Cancel", "Delete", "Edit" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Produit List | Parent (breadcrumb) |
| Release Detail | Child (release row click) |
