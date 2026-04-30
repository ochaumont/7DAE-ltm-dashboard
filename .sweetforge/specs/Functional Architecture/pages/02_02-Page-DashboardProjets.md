# Page Specification — Dashboard Projets

> Functional and layout specification for the Manager project dashboard. Provides KPIs and a filterable project table.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Dashboard Projets |
| Route | `/dashboard/projets` |
| Page Type | Dashboard |
| Parent Page | None |
| Access Roles | Manager |
| Status | Implemented |

---

## 2. Purpose

Provide a manager-level overview of all projects in the portfolio. Displays key performance indicators (total projects, active projects, late milestones, high-risk count) and a filterable DataTable of projects. Enables quick navigation to individual project details.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Navbar | Click "Dashboard" | Any page (Manager role) |
| Login redirect | Automatic after login | Manager role |
| Dashboard redirect | Redirected from `/dashboard` | Manager role |
| Sibling tab | Click "Projets" tab in dashboard nav | Dashboard Ressources / Alertes |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Row click | `/projets/[id]` (Project detail) |
| Dashboard tab | `/dashboard/ressources` or `/dashboard/alertes` |

---

## 4. Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard         [Projets] [Ressources] [Alertes]     │
├─────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                │
│  │ Total│  │Active│  │ Late │  │ High │                │
│  │  12  │  │   8  │  │   3  │  │   2  │                │
│  └──────┘  └──────┘  └──────┘  └──────┘                │
├─────────────────────────────────────────────────────────┤
│  Filter: [StatutProjet v]           [Search...]         │
├─────────────────────────────────────────────────────────┤
│  Nom  | Chef de Projet | TL | FL | Statut | Next MS .. │
│  ─────┼────────────────┼────┼────┼────────┼─────────── │
│  Prj1 | Jean Dupont    | .. | .. | ACTIF  | G2 (15/04) │
│  Prj2 | Marie Martin   | .. | .. | CLOTURE| —          │
│  ...  | ...            | .. | .. | ...    | ...        │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Header Zone

| Element | Description |
|---------|-------------|
| Title | "Dashboard" |
| Subtitle | None |
| Actions | Dashboard sub-tabs (Projets, Ressources, Alertes) |

### 4.3 Tabs (if Detail Page)

| Tab | Label | Content Summary |
|-----|-------|-----------------|
| 1 | Projets | KPI cards + project table (this page) |
| 2 | Ressources | Capacity overview |
| 3 | Alertes | Planning alerts |

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/projets | All projects | -- |
| 1 | GET /api/projets/{id}/milestones (for each project) | Milestone data for next milestone + late detection | -- |
| 1 | GET /api/projets/{id}/risques (for each project) | Risk data for KPI + health | -- |

- **Parallel calls**: Initial GET /api/projets fetched first, then milestones and risques for each project fetched in parallel via Promise.all.

### 5.2 Refresh Strategy

- **After create/update/delete**: Not applicable (read-only dashboard).
- **Loading behavior on refetch**: Standard spinner on initial load.

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| KPI: Total projects | Count of all projects | projets array |
| KPI: Active projects | Count where statut = ACTIF | projets array |
| KPI: Late milestones | Count milestones where datePrevue < today AND statut != ATTEINT | All milestones (RG-04) |
| KPI: High risks | Count risks with high severity score | All risques |
| Next milestone | Nearest future milestone per project | Project milestones |
| Health emoji | Computed from late milestone count + high risk count | Milestones + risques per project |
| Filtered list | Projects matching StatutProjet dropdown | projets + filter state |

---

## 6. Content Zones

### 6.1 Zone: KPI Cards

**Type**: KPI Cards

**Data displayed**:

| Card | Source | Notes |
|------|--------|-------|
| Total Projects | projets.length | -- |
| Active Projects | projets.filter(statut=ACTIF).length | -- |
| Late Milestones | milestones with datePrevue < today && statut != ATTEINT | RG-04 |
| High Risks | risques with high severity | -- |

### 6.2 Zone: Project Table

**Type**: Table (DataTable)

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Nom | projet.nom | Yes | -- |
| Chef de Projet | projet.chefDeProjet | Yes | Display name |
| Technical Leader | projet.technicalLeader | Yes | Display name |
| Functional Leader | projet.functionalLeader | Yes | Display name |
| Statut | projet.statut | Yes | Badge component, color-coded |
| Next Milestone | Computed from milestones | Yes | Type + datePrevue |
| Nb Risques | risques.length | Yes | Count |
| Sante | Computed | Yes | Health emoji |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Row click | Click anywhere on row | Navigate to `/projets/[id]` |
| Filter | Select StatutProjet from dropdown | Client-side filter on statut |
| Search | Type in search bar | Client-side filter on nom |

**Features**:
- [x] Sortable columns
- [ ] Pagination (configurable rows/page)
- [x] Search/filter
- [ ] Column visibility/order settings
- [ ] Excel export
- [ ] Drag & drop

---

## 7. Modals & Dialogs

None (read-only dashboard page).

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loaded | Data available | KPI cards + table |
| Empty | No projects exist | "No projects found" message |
| Empty filter | Filter/search yields no results | "No results match your filter" |
| Error | API call fails | Toast notification (auto via interceptor) |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| RG-04 | Late milestone detection | Milestones with datePrevue < today and statut != ATTEINT shown as EN_RETARD. Counted in KPI. |

---

## 10. Table Settings

Not applicable (dashboard table does not use useTableSettings).

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| dashboards | projets.title | "Projects Dashboard" |
| dashboards | projets.kpi.total | "Total Projects" |
| dashboards | projets.kpi.active | "Active" |
| dashboards | projets.kpi.lateMilestones | "Late Milestones" |
| dashboards | projets.kpi.highRisks | "High Risks" |
| dashboards | projets.columns.* | Column headers |
| enums | statutProjet.* | Status labels |
| common | actions.* | Generic actions |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Dashboard Ressources | Sibling tab |
| Dashboard Alertes | Sibling tab |
| Projet Detail | Child (row click navigation) |
