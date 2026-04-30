# Page Specification — Projet Detail

> Functional and layout specification for the Project detail page. Complex orchestrator with 9 tabs covering synthesis, milestones, phases, livrables, work packages, Gantt, workload, risks, and team.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Projet Detail |
| Route | `/projets/[id]` |
| Page Type | Detail |
| Parent Page | Projet List (`/projets`) |
| Access Roles | CP, Manager |
| Status | Implemented |

---

## 2. Purpose

Serve as the central project management hub. Orchestrates 9 specialized tabs covering every aspect of project management: synthesis with KPIs, milestone tracking, phase management, livrable tracking, work package overview, Gantt timeline, workload analysis, risk management, and team composition. The parent component handles data loading and passes shared datasets to each tab.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Row click | Click a project row in Projet List | `/projets` |
| Row click | Click a project row in Dashboard Projets | `/dashboard/projets` |
| Breadcrumb | Click project name | Child pages |
| Direct URL | Navigate to `/projets/[id]` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Breadcrumb "Projets" | `/projets` |
| Livrable link (in LivrablesTab) | `/produits/[id]/releases/[releaseId]` (release detail) |
| WP row click (in WorkpackagesTab) | `/projets/[wpId]` (child project detail) |

---

## 4. Layout

### 4.1 Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Breadcrumb: Projets > Parent WP (if any) > Project Name        │
│  Project Name                                 [Edit] [Delete]    │
│  Status badge   Type badge                                       │
├──────────────────────────────────────────────────────────────────┤
│  [Synthese][Milestones][Phases][Livrables][WP][Gantt][Charge]   │
│  [Risques][Team]                                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tab Content Area                                                │
│  (varies by active tab — see sections 6.x below)                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | Project name (`projet.nom`) |
| Subtitle | Status badge + type badge (PROJECT/WORK_PACKAGE) |
| Actions | Edit button, Delete button (in parent, not tabs) |
| Breadcrumb | Dynamic: walks parentId chain to build full path (e.g., Projets > Parent Project > This WP) |

### 4.3 Tabs

| Tab | Label | Content Summary | Lines |
|-----|-------|-----------------|-------|
| 1 | Synthese | KPI cards, MilestoneProgressCard SVG, RG-04/RG-06 alerts | 547 |
| 2 | Milestones | DataTable + expandable phase rows, CRUD, phase linking | 750 |
| 3 | Phases | Phase CRUD, owned + associated livrables, milestone links | 1184 |
| 4 | Livrables | Project livrables table, CRUD | 263 |
| 5 | Work Packages | WP livrables + associations from child projects | 383 |
| 6 | Gantt | MilestoneGantt (gantt-task-react), ssr:false | 356 |
| 7 | Charge | Workload table (lazy-loaded on tab activation) | 79 |
| 8 | Risques | Risk table + CRUD | 364 |
| 9 | Team | useTeamCRUD, Combobox add, role management | 223 |

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/projets/{id} | Project details | -- |
| 1 | GET /api/projets/{id}/milestones | Project milestones | -- |
| 1 | GET /api/projets/{id}/livrables | Project-livrable associations (ProjetLivrable) | -- |
| 1 | GET /api/projets/{id}/risques | Project risks | -- |
| 1 | GET /api/projets/{id}/team | Team members | -- |
| 1 | GET /api/projets/{id}/phases | Project phases | -- |
| 1 | GET /api/ressources | All resources | -- |
| 1 | GET /api/projets | All projects (for WP hierarchy + parent lookup) | -- |
| 1 | GET /api/settings/user-roles | Available roles | -- |
| 1 | GET /api/projets/{id}/assignments | Project assignments | -- |
| 2 | GET /api/produits | All products (for livrable context) | -- |
| 2 | GET /api/produits/{id}/releases (for each product) | Releases | Product IDs from produits |
| 3 | GET /api/releases/{releaseId}/livrables (for each release) | Livrables (build lookup map) | Release IDs from order 2 |
| 2 | GET /api/phases/{phaseId}/livrables (for each phase) | Phase-livrable links | Phase IDs from order 1 |

- **Parallel calls**: All order-1 calls run in parallel (11 endpoints) via Promise.all.
- **Sequential calls**: Order 2 depends on IDs from order 1. Order 3 depends on release IDs from order 2.
- **Note**: The livrable context chain (produits -> releases -> livrables) is needed because there is no API to fetch a livrable by ID alone.

### 5.2 Refresh Strategy

- **After create/update/delete**: Full refetch via shared `fetchAll()` / `onRefresh()` callback passed to each tab.
- **Loading behavior on refetch**: No spinner (initialLoadDone ref prevents remount).

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Livrable lookup map | Map<UUID, Livrable> for O(1) resolution | produits -> releases -> livrables |
| Breadcrumb chain | Walk parentId chain to build breadcrumb path | allProjets + projet.parentId |
| KPI values (SyntheseTab) | Late milestones, risk counts, progress | Milestones + risques |
| MilestoneProgressCard SVG | Visual milestone timeline diagram | Milestones data |
| G2/G5/G7/G9 order check | RG-06 chronological validation | Milestones by type |
| Planning alerts | RG-05 incompatibility checks | Milestones + releases |
| Phase-livrable mapping | Which livrables belong to which phases | Phase-livrable links |
| WP livrables | Aggregated livrables from child work packages | Child projets + their livrables |

---

## 6. Content Zones

### 6.1 Zone: SyntheseTab (547 lines)

**Type**: Dashboard-style synthesis

**Data displayed**:
- KPI cards: milestone count, late count, risk count, overall progress
- MilestoneProgressCard: SVG diagram showing milestone timeline with progress indicators
- DiagramExporter: allows exporting the SVG diagram
- Alert banners: RG-04 (late milestones) and RG-06 (G2/G5/G7/G9 chronological order warnings, yellow banner)

### 6.2 Zone: MilestonesTab (750 lines)

**Type**: Table (DataTable) with expandable rows

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Type | milestone.type | Yes | G2, G5, G7, G9, custom |
| Description | milestone.description | Yes | -- |
| Date Prevue | milestone.datePrevue | Yes | Date format |
| Date Reelle | milestone.dateReelle | Yes | Date format |
| Statut | milestone.statut | Yes | Badge, auto EN_RETARD via RG-04 |
| Phases | Linked phases | No | Expandable row showing linked phases |
| Actions | -- | No | Edit, Delete, Link phases |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Create | Click [+ Milestone] | Open milestone CRUD modal |
| Edit | Click pencil icon | Open milestone CRUD modal (edit) |
| Delete | Click trash icon | Confirm delete modal |
| Link phases | Click link icon | Open phase linking modal |
| Expand row | Click expand toggle | Show linked phases inline |

**Business rules**: RG-06 warning banner when G2/G5/G7/G9 not in chronological order.

### 6.3 Zone: PhasesTab (1184 lines)

**Type**: Custom (phase management with dual livrable sections)

**Sub-zones**:
- Phase list with CRUD
- **OwnedLivrablesSection**: Livrables directly owned by phases (create/edit/delete)
- **AssociatedLivrablesSection**: Livrables associated from releases (link/unlink)
- Milestone link management

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Create phase | Click [+ Phase] | Open phase CRUD modal |
| Edit phase | Click edit | Phase CRUD modal (edit) |
| Delete phase | Click delete | Confirm delete modal |
| Add owned livrable | Click [+] in owned section | Open livrable CRUD modal |
| Associate livrable | Click [Associate] | Open association picker modal |
| Unlink livrable | Click unlink icon | POST /api/phases/{phaseId}/livrables (unlink) |
| Link milestone | Click link icon | Open milestone linking modal |

### 6.4 Zone: LivrablesTab (263 lines)

**Type**: Table (DataTable)

**Data displayed**: Project livrables with columns: nom, description, release info, statut, priorite, actions.

**Interactions**: Standard CRUD + link to release detail page.

### 6.5 Zone: WorkpackagesTab (383 lines)

**Type**: Custom (aggregated view)

Displays livrables and associations from child work packages (child projects). Read-oriented view aggregating data from the WP hierarchy.

### 6.6 Zone: GanttTab (356 lines)

**Type**: Chart (MilestoneGantt)

**Note**: Dynamically imported with `{ ssr: false }` (gantt-task-react wrapper is not SSR-compatible).

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| View mode toggle | Click view mode buttons | Switch Day/Week/Month/Year |
| Zoom | Scroll / buttons | Zoom in/out on timeline |

### 6.7 Zone: ChargeTab (79 lines)

**Type**: Table (workload table, read-only)

**Loading**: Lazy-loaded on tab activation (not loaded on page mount).

Displays resource workload distribution for the project.

### 6.8 Zone: RisquesTab (364 lines)

**Type**: Table (DataTable) with CRUD

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Description | risque.description | Yes | -- |
| Probabilite | risque.probabilite | Yes | Score display |
| Impact | risque.impact | Yes | Score display |
| Severite | Computed (prob x impact) | Yes | Color-coded badge |
| Statut | risque.statut | Yes | Badge |
| Mitigation | risque.mitigation | Yes | -- |
| Actions | -- | No | Edit + Delete |

**Interactions**: Standard CRUD (create, edit, delete).

### 6.9 Zone: TeamTab (223 lines)

**Type**: Custom (team management)

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Add member | Select resource from Combobox | POST /api/projets/{projetId}/team |
| Edit roles | Click role badges on member | Toggle roles via PUT, multi-role support |
| Remove member | Click remove icon | DELETE /api/projets/{projetId}/team/{memberId} |

---

## 7. Modals & Dialogs

### 7.1 CRUD Modal — Project Edit (in parent header)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Description | Textarea | No | -- | -- |
| Statut | Select | Yes | -- | StatutProjet enum |
| Chef de Projet | Select | No | -- | From ressources |
| Technical Leader | Select | No | -- | From ressources |
| Functional Leader | Select | No | -- | From ressources |
| Date Debut | Date picker | No | -- | -- |
| Date Fin | Date picker | No | After dateDebut | -- |

### 7.2 Confirm Delete Modal (in parent header)

- **Message**: "Are you sure you want to delete {projet.nom}?"
- **On confirm**: DELETE /api/projets/{id} -> navigate to /projets.

### 7.3 Milestone CRUD Modal (in MilestonesTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Type | Select | Yes | -- | STANDARD_MILESTONE_TYPES (G2, G5, G7, G9) + custom |
| Description | Textarea | No | -- | -- |
| DatePrevue | Date picker | Yes | -- | -- |
| DateReelle | Date picker | No | -- | -- |
| Statut | Select | Yes | -- | StatutMilestone enum |

### 7.4 Phase CRUD Modal (in PhasesTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Nom | Text input | Yes | Min 1 char | -- |
| Description | Textarea | No | -- | -- |
| DateDebut | Date picker | No | -- | -- |
| DateFin | Date picker | No | After dateDebut | -- |
| Ordre | Number | No | >= 0 | Display order |

### 7.5 Phase Linking Modal (in MilestonesTab)

Select phases to link to a milestone. Multi-select with checkboxes.

### 7.6 Livrable Association Modal (in PhasesTab)

Select livrables from releases to associate with a phase. Multi-select picker.

### 7.7 Risk CRUD Modal (in RisquesTab)

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Description | Textarea | Yes | Min 1 char | -- |
| Probabilite | Select | Yes | -- | Scoring map from constants |
| Impact | Select | Yes | -- | Scoring map from constants |
| Statut | Select | Yes | -- | Risk status enum |
| Mitigation | Textarea | No | -- | -- |

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loading (refetch) | Data refresh after mutation | No spinner, silent refresh |
| Project not found | Invalid project ID | Error state / redirect |
| Empty tab content | No milestones/phases/livrables/etc. | Tab-specific empty state message |
| Error | API call fails | Toast notification (auto) |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| RG-04 | Late milestone detection: datePrevue < today && statut != ATTEINT | SyntheseTab alert banner, MilestonesTab auto EN_RETARD status |
| RG-05 | Planning incompatibilities: milestone.datePrevue < release.dateLivraisonPrevue | SyntheseTab alert display |
| RG-06 | G2/G5/G7/G9 chronological order | SyntheseTab + MilestonesTab yellow warning banner when order violated |

---

## 10. Table Settings

| Setting | Default | Persisted |
|---------|---------|-----------|
| Milestones rows per page | 10 | localStorage |
| Risques rows per page | 10 | localStorage |
| Livrables rows per page | 10 | localStorage |

Note: Each tab's DataTable may have its own useTableSettings instance with a dedicated storageKey.

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| projets | detail.title | Project name (dynamic) |
| projets | tabs.* | "Synthese", "Milestones", "Phases", "Livrables", etc. |
| projets | milestones.* | Milestone-related labels |
| projets | phases.* | Phase-related labels |
| projets | livrables.* | Livrable-related labels |
| projets | risques.* | Risk-related labels |
| projets | team.* | Team-related labels |
| projets | kpi.* | KPI card labels |
| projets | alerts.* | Alert messages |
| enums | statutProjet.* | Project status labels |
| enums | statutMilestone.* | Milestone status labels |
| enums | typeMilestone.* | Milestone type labels |
| common | actions.* | "Save", "Cancel", "Delete", "Edit" |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Projet List | Parent (breadcrumb) |
| Parent Project | Grandparent (breadcrumb, if WP) |
| Child Work Packages | Children (WorkpackagesTab, row click) |
| Release Detail | Cross-link (livrable link in LivrablesTab) |
| Dashboard Projets | Cross-link (Manager entry point) |
