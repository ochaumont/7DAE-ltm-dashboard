# Page Specification — Dashboard Alertes

> Functional and layout specification for the Manager alerts dashboard. Displays planning incompatibility alerts and resource overload alerts.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Page Name | Dashboard Alertes |
| Route | `/dashboard/alertes` |
| Page Type | Dashboard |
| Parent Page | None |
| Access Roles | Manager |
| Status | Implemented |

---

## 2. Purpose

Surface planning incompatibilities and resource overload alerts in a single view. Aggregates data from projects, milestones, resources, and leave periods to compute alerts based on business rules RG-05 (planning incompatibilities) and RG-03 (capacity overloads). Displayed as cards, not tables.

---

## 3. Navigation & Entry Points

### 3.1 How Users Reach This Page

| Entry Point | Action | Context |
|-------------|--------|---------|
| Dashboard tab | Click "Alertes" tab in dashboard nav | Dashboard Projets / Ressources |
| Direct URL | Navigate to `/dashboard/alertes` | Bookmark / shared link |

### 3.2 Outgoing Navigation

| Trigger | Destination |
|---------|-------------|
| Dashboard tab | `/dashboard/projets` or `/dashboard/ressources` |

---

## 4. Layout

### 4.1 Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard         [Projets] [Ressources] [Alertes]     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Planning Incompatibilities                             │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚠ Projet X: Milestone G5 (2026-03-01) is       │   │
│  │   before Release R2 delivery (2026-04-15)       │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚠ Projet Y: Milestone G7 (2026-05-10) is       │   │
│  │   before Release R1 delivery (2026-06-01)       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Resource Overloads                                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ⚠ Jean Dupont: Overloaded in April 2026         │   │
│  │   Capacity: 120% (20 days allocated / 17 avail) │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
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
| 2 | Ressources | Capacity overview |
| 3 | Alertes | Planning + capacity alerts (this page) |

---

## 5. Data Loading

### 5.1 API Calls on Mount

| Order | Endpoint | Purpose | Depends On |
|-------|----------|---------|------------|
| 1 | GET /api/projets | All projects | -- |
| 1 | GET /api/ressources | All resources | -- |
| 2 | GET /api/projets/{id}/milestones (for each) | Milestones for planning checks | Project IDs from call 1 |
| 2 | GET /api/ressources/{id}/conges (for each) | Leave periods for capacity calc | Resource IDs from call 1 |

- **Parallel calls**: Projects and resources fetched in parallel (call 1). Then milestones and conges fetched in parallel (call 2).
- **Sequential calls**: Call 2 depends on IDs from call 1.

### 5.2 Refresh Strategy

- **After create/update/delete**: Not applicable (read-only dashboard).
- **Loading behavior on refetch**: Standard spinner on initial load.

### 5.3 Derived / Computed Data

| Computation | Description | Source Data |
|-------------|-------------|-------------|
| Planning alerts | RG-05: milestone.datePrevue < release.dateLivraisonPrevue | Projects + milestones + releases |
| Capacity alerts | RG-03: resources where computed capacity exceeds 100% | Resources + conges |
| Alert cards | Formatted alert objects with severity, message, context | Computed alerts |

---

## 6. Content Zones

### 6.1 Zone: Planning Incompatibilities

**Type**: Custom (Card-based alert display)

**Data displayed**:

| Field | Source | Notes |
|-------|--------|-------|
| Alert icon | Severity level | Warning icon |
| Project name | projet.nom | Context for the alert |
| Milestone info | milestone.type + datePrevue | The offending milestone |
| Release info | release.nom + dateLivraisonPrevue | The conflicting release date |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| None | -- | Alerts are informational, no click actions |

### 6.2 Zone: Resource Overloads

**Type**: Custom (Card-based alert display)

**Data displayed**:

| Field | Source | Notes |
|-------|--------|-------|
| Alert icon | Severity level | Warning icon |
| Resource name | ressource.nom + prenom | Overloaded resource |
| Month | Computed | The month with overload |
| Capacity detail | Computed from RG-03 | Percentage + day counts |

**Interactions**:

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| None | -- | Alerts are informational, no click actions |

---

## 7. Modals & Dialogs

None (read-only dashboard page).

---

## 8. UI States

| State | Condition | Display |
|-------|-----------|---------|
| Loading (initial) | First mount, data not loaded | Page skeleton / spinner |
| Loaded | Data available | Alert cards displayed |
| No alerts | All checks pass | "No alerts" message / empty state |
| Error | API call fails | Toast notification (auto via interceptor) |

---

## 9. Business Rules Applied

| Rule | Description | Effect on Page |
|------|-------------|---------------|
| RG-05 | Planning incompatibilities: milestone.datePrevue < release.dateLivraisonPrevue | Generates planning alert cards |
| RG-03 | Monthly capacity formula: workingDays x (pct/100) - leaveDays | Generates capacity overload alert cards |

---

## 10. Table Settings

Not applicable (no tables on this page).

---

## 11. Internationalization

| Namespace | Key Pattern | Example |
|-----------|-------------|---------|
| dashboards | alertes.title | "Alerts" |
| dashboards | alertes.planning.title | "Planning Incompatibilities" |
| dashboards | alertes.capacity.title | "Resource Overloads" |
| dashboards | alertes.noAlerts | "No alerts" |
| projets | milestones.types.* | Milestone type labels |
| common | actions.* | Generic actions |

---

## 12. Related Pages

| Page | Relationship |
|------|-------------|
| Dashboard Projets | Sibling tab |
| Dashboard Ressources | Sibling tab |
