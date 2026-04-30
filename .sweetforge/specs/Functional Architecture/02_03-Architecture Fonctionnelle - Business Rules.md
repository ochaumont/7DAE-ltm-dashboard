# Architecture Fonctionnelle: Business Rules

## Overview

- **Rule naming:** COMP-XX (computation), DISP-XX (display), VR-XX (validation), BR-XX (business)
- **Enforcement:** FE (frontend only)

---

## Computation Rules

### COMP-01: Monthly Resource Capacity (RG-03)

| Field | Value |
|-------|-------|
| Description | Net monthly working capacity for a resource |
| Formula | `capacity = workingDays × (pct / 100) − leaveDays` |
| Enforcement | FE |

**Variables:**

- **workingDays:** Count Mon-Fri days in the month (`getWorkingDays(year, month)`)
- **pct:** `ressource.regimeTravail === "TEMPS_PLEIN" ? 100 : ressource.pourcentageTempsTravail ?? 100`
- **leaveDays:** Count overlapping Mon-Fri leave days in month (`getLeaveDaysInMonth(conges, year, month)`)

**Implementation:** `capacity.ts` → `computeCapacity()`, `getWorkingDays()`, `getLeaveDaysInMonth()`

**Entities:** Ressource (regimeTravail, pourcentageTempsTravail), PeriodeConges (dateDebut, dateFin)

**Used by:** Ressource detail CapaciteTab (12-month rolling window), Dashboard Ressources

---

### COMP-02: Risk Criticality Score

| Field | Value |
|-------|-------|
| Description | Risk criticality = probability score × impact score |
| Formula | `PROBABILITE_SCORE[risque.probabilite] × IMPACT_SCORE[risque.impact]` |
| Enforcement | FE |

**Variables:**

- PROBABILITE_SCORE: FAIBLE=1, MOYENNE=2, ELEVEE=3
- IMPACT_SCORE: FAIBLE=1, MOYEN=2, ELEVE=3
- Result range: 1-9

**Implementation:** `constants.ts` → `PROBABILITE_SCORE`, `IMPACT_SCORE`

**Entities:** Risque (probabilite, impact)

**Used by:** RisquesTab (sorting, risk matrix coloring)

---

### COMP-03: Planning Incompatibility Detection (RG-05)

| Field | Value |
|-------|-------|
| Description | Detect milestone dates that are before their associated release delivery dates |
| Formula | `milestone.datePrevue < release.dateLivraisonPrevue` for each milestone×projetLivrable×release triple |
| Enforcement | FE |

**Implementation:** `alerts.ts` → `computePlanningAlerts()`, `findProjectAlerts()`

**Entities:** Projet, Milestone, ProjetLivrable, Livrable, Release

**Used by:** Dashboard Alertes, SyntheseTab

---

## Display Rules

### DISP-01: Milestone Late Detection (RG-04)

| Field | Value |
|-------|-------|
| Description | Milestone shown as "Late" if planned date passed and not achieved |
| Condition | `(ms.dateReelle ? ms.dateReelle > ms.datePrevue : ms.statut !== "DONE" && ms.datePrevue < today)` |
| Visual Effect | "LATE" compliance badge (red), vs "ON_TIME" (green) |
| Enforcement | FE only (display-side) |

**Implementation:** `constants.ts` → `getPlanCompliance(ms, today?)`

**Returns:** `PlanCompliance` ("ON_TIME" | "LATE")

**Used by:** MilestonesTab (plan compliance column), SyntheseTab (KPI cards)

---

### DISP-02: Standard Milestone Chronological Order Warning (RG-06)

| Field | Value |
|-------|-------|
| Description | G2→G5→G7→G9 gate milestones must be in chronological order |
| Condition | Check datePrevue ordering of STANDARD_MILESTONE_TYPES (G2_SCOPE, G5_BUDGET, G7_DEPLOIEMENT, G9_CLOTURE) |
| Visual Effect | Yellow warning banner at top of milestones section |
| Enforcement | FE only (warning, not blocking) |

**Implementation:** Computed in ProjetDetailPage, passed as `outOfOrder` prop

**Entities:** Milestone (type, datePrevue)

**Used by:** MilestonesTab, SyntheseTab

---

### DISP-03: Status Badge Coloring

| Field | Value |
|-------|-------|
| Description | Every status enum is mapped to a semantic color via constants |
| Enforcement | FE |

**Color maps in `constants.ts`:**

- `MS_STATUT_COLORS`: DONE→green, IN_PROGRESS→yellow, TODO→gray
- `PHASE_STATUT_COLORS`: same as milestone
- `LIV_STATUT_COLORS`: TERMINE→green, EN_COURS→yellow, ANNULE→red, A_FAIRE→gray
- `LIV_PRIORITE_COLORS`: HAUTE→red, MOYENNE→yellow, BASSE→gray
- `RISQUE_STATUT_COLORS`: IDENTIFIE→red, EN_COURS_MITIGATION→yellow, RESOLU→green, ACCEPTE→gray
- `RELEASE_STATUT_COLORS`: PLANIFIEE→blue, EN_COURS→yellow, LIVREE→green, ANNULEE→gray

---

### DISP-04: Effective Status Override

| Field | Value |
|-------|-------|
| Description | Project/entity display name with alias prefix if set |
| Condition | `p.alias ? "${p.alias} - ${p.nom}" : p.nom` |
| Enforcement | FE |

**Implementation:** `constants.ts` → `getProjetDisplayName(p)`

---

### DISP-05: Priority Threshold Filter

| Field | Value |
|-------|-------|
| Description | Selecting a priority threshold includes all priorities at that level and above |
| Condition | HAUTE includes only HAUTE; MOYENNE includes HAUTE+MOYENNE; BASSE includes all |
| Enforcement | FE |

**Implementation:** `constants.ts` → `PRIORITY_INCLUDES` (Record of Set)

---

## Business Rules

### BR-01: Release LIVREE Transition (RG-07)

| Field | Value |
|-------|-------|
| Description | Cannot mark a release as LIVREE unless all its livrables are TERMINE or ANNULE |
| Enforcement | FE (blocking modal) |

**Implementation:** ReleasesTab checks all livrables statut before allowing status change

**User-facing:** Modal blocks save with error message if any livrable is not TERMINE/ANNULE

---

### BR-02: Affectation Total ≤ 100% (RG-02)

| Field | Value |
|-------|-------|
| Description | Total resource assignment percentage per livrable must not exceed 100% |
| Enforcement | FE (modal validation) |

**Implementation:** AssignmentModal sums all pourcentage values, blocks save if > 100%

**Used by:** Release detail page, product detail ReleasesTab

---

## Validation Rules

### VR-01: Form Field Validation

All CRUD forms use Zod schemas for validation. Common patterns:

- **Name:** required, min 1 character
- **Email:** valid email format
- **Percentage:** 0-100, numeric
- **Dates:** valid ISO date string, start before end for ACTIVITY type livrables

**Implementation:** `useFormValidation(zodSchema)` hook → per-field inline error display

---

## Rule Summary Table

| Code | Name | Category | Enforcement | Entities |
|------|------|----------|-------------|----------|
| COMP-01 | Monthly Resource Capacity | Computation | FE | Ressource, PeriodeConges |
| COMP-02 | Risk Criticality Score | Computation | FE | Risque |
| COMP-03 | Planning Incompatibility | Computation | FE | Projet, Milestone, Release, ProjetLivrable, Livrable |
| DISP-01 | Milestone Late Detection | Display | FE | Milestone |
| DISP-02 | Gate Chronological Order | Display | FE | Milestone |
| DISP-03 | Status Badge Coloring | Display | FE | All entities with status |
| DISP-04 | Display Name with Alias | Display | FE | Projet |
| DISP-05 | Priority Threshold Filter | Display | FE | Livrable, Risque |
| BR-01 | Release LIVREE Transition | Business | FE | Release, Livrable |
| BR-02 | Affectation Total ≤ 100% | Business | FE | Affectation |
| VR-01 | Form Field Validation | Validation | FE | All entities |
