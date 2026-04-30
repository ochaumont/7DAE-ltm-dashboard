# Page Specification — Dashboard Ressources

> Functional and layout specification for the Manager resource capacity dashboard. Provides monthly capacity overview with color-coded bars.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Dashboard Ressources |
| Route | `/dashboard/ressources` |
| Page Type | Dashboard |
| Parent Page | None |
| Access Roles | Manager |
| Status | Implemented |

---

## 2. Purpose

Provide a manager-level overview of resource capacity across the organization. Displays KPI cards summarizing resource utilization and a visual capacity bar for each resource, color-coded to highlight overloads. Enables quick navigation to individual resource details.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Dashboard tab | Click "Ressources" tab in dashboard nav | Dashboard Projets / Alertes |
| Direct URL | Navigate to `/dashboard/ressources` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Resource click | `/ressources/[id]` (Resource detail) |
| Dashboard tab | `/dashboard/projets` or `/dashboard/alertes` |

---

## 4. Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard         [Projets] [Ressources] [Alertes]     │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Total   │  │ Overload │  │ Available│              │
│  │   24     │  │    3     │  │   18     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
├─────────────────────────────────────────────────────────┤
│  Resource Name      | Capacity Bar (month)              │
│  ───────────────────┼─────────────────────────────────  │
│  Jean Dupont        | ████████████░░░  80%              │
│  Marie Martin       | ████████████████████ 120% (RED)   │
│  Pierre Durand      | ██████░░░░░░░░░  40%              │
│  ...                | ...                               │
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
| 1 | Projets | Project KPIs + table |
| 2 | Ressources | Capacity overview (this page) |
| 3 | Alertes | Planning alerts |

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/ressources | All resources | -- |
| 2 | GET /api/ressources/{id}/conges (for each) | Leave periods for capacity calc | Needs resource IDs from call 1 |

- **Parallel calls**: Call 1 fetches all resources, then leave periods for each resource are fetched in parallel via Promise.all.
- **Sequential calls**: Call 2 depends on resource IDs from call 1.

### 5.2 Refresh Strategy

- **After create/update/delete**: Not applicable (read-only dashboard).
- **Loading behavior on refetch**: Standard spinner on initial load.

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Monthly capacity | workingDays x (pct/100) - leaveDays per month | Resources + conges (RG-03) |
| KPI: Total resources | Count of all resources | ressources array |
| KPI: Overloaded | Resources with capacity > 100% | Computed capacity |
| KPI: Available | Resources with remaining capacity | Computed capacity |
| Capacity bar color | Red if overloaded (>100%), blue if normal | Computed capacity per resource |

---

## 6. Content Zones

### 6.1 Zone: KPI Cards

**Type**: KPI Cards

**Data displayed**:

| Card | Source | Notes |
|------|--------|-------|
| Total Resources | ressources.length | -- |
| Overloaded | Count where capacity > 100% | Red highlight |
| Available | Count where capacity < 100% | -- |

### 6.2 Zone: Capacity Bars

**Type**: Custom (bar chart per resource)

**Data displayed**:

| Column / Field | Source | Sortable | Notes |
|---------------|--------|----------|-------|
| Resource Name | ressource.nom + prenom | No | Clickable link |
| Capacity Bar | Computed from RG-03 | No | Color-coded: red = overload (>100%), blue = normal |
| Percentage | Computed | No | Numeric display |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Resource click | Click on resource name/bar | Navigate to `/ressources/[id]` |

**Features**:
- [ ] Sortable columns
- [ ] Pagination (configurable rows/page)
- [ ] Search/filter
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
| Loaded | Data available | KPI cards + capacity bars |
| Empty | No resources exist | "No resources found" message |
| Error | API call fails | Toast notification (auto via interceptor) |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| RG-03 | Monthly capacity formula: workingDays x (pct/100) - leaveDays | Used to compute capacity bars and overload detection |

---

## 10. Table Settings

Not applicable (no DataTable on this page).

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| dashboards | ressources.title | "Resources Dashboard" |
| dashboards | ressources.kpi.total | "Total Resources" |
| dashboards | ressources.kpi.overloaded | "Overloaded" |
| dashboards | ressources.kpi.available | "Available" |
| common | actions.* | Generic actions |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Dashboard Projets | Sibling tab |
| Dashboard Alertes | Sibling tab |
| Ressource Detail | Child (click navigation) |
