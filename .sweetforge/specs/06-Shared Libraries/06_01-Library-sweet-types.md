# Shared Library Specification — sweet-types

> Specification for an internal shared library/package: purpose, public API, components, build configuration, and usage.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Package Name | sweet-types |
| Directory | sweet-types/ |
| Version | 0.1.0 |
| Private | Yes |
| Status | Stable |

---

## 2. Purpose

Shared TypeScript types and constants consumed by sweet-gantt and sweet-releaseGrid. Ensures type consistency across all packages without duplicating definitions. The types mirror the backend Java entities and enums, while the constants encode shared business logic (color maps, plan compliance rules).

---

## 3. Public API (Exports)

### 3.1 Components

_No components — this is a types-only package._

### 3.2 Hooks

_No hooks._

### 3.3 Types

| Export | Description |
|--------|-------------|
| `StatutRelease` | Union type: `"PLANIFIEE" \| "EN_COURS" \| "LIVREE" \| "ANNULEE"` |
| `StatutLivrable` | Union type: `"A_FAIRE" \| "EN_COURS" \| "TERMINE" \| "ANNULE"` |
| `StatutMilestone` | Union type: `"TODO" \| "IN_PROGRESS" \| "DONE"` |
| `StatutPhase` | Union type: `"TODO" \| "IN_PROGRESS" \| "DONE"` |
| `PlanCompliance` | Union type: `"ON_TIME" \| "LATE"` |
| `Priorite` | Union type: `"HAUTE" \| "MOYENNE" \| "BASSE"` |
| `TypeMilestone` | Union type: `"G2_SCOPE" \| "G5_BUDGET" \| "G7_DEPLOIEMENT" \| "G9_CLOTURE" \| "CUSTOM"` |
| `TypeProduit` | Union type: `"SOFTWARE" \| "HARDWARE"` |
| `OrigineProduit` | Union type: `"CREATED" \| "IMPORTED"` |
| `TypeLivrable` | Union type: `"EVENT" \| "ACTIVITY"` |
| `StatutProjet` | Union type: `"INITIATION" \| "EN_COURS" \| "TERMINE" \| "SUSPENDU"` |
| `TypeProjet` | Union type: `"PROJECT" \| "WORK_PACKAGE"` |
| `Produit` | Interface — product entity |
| `Release` | Interface — release entity |
| `Livrable` | Interface — deliverable entity |
| `Milestone` | Interface — milestone entity |
| `Projet` | Interface — project entity |
| `ProjectPhase` | Interface — project phase entity |
| `PhaseLivrable` | Interface — phase-livrable link entity |

### 3.4 Utilities

| Export | Description |
|----------|---------|
| `getTodayString()` | Returns today's date as ISO string (YYYY-MM-DD) |
| `getPlanCompliance(ms, today?)` | Computes whether a milestone is ON_TIME or LATE (RG-04 rule) |
| `MS_STATUT_COLORS` | `Record<StatutMilestone, "green" \| "yellow" \| "gray">` |
| `LIV_STATUT_COLORS` | `Record<StatutLivrable, "green" \| "yellow" \| "red" \| "gray">` |
| `RELEASE_STATUT_COLORS` | `Record<StatutRelease, "blue" \| "yellow" \| "green" \| "gray">` |
| `MS_GANTT_COLORS` | `Record<StatutMilestone, string>` — hex colors for Gantt chart markers |
| `PHASE_BAR_COLORS` | `Record<StatutPhase, string>` — hex colors for Gantt phase bars |
| `RELEASE_BAR_COLORS` | `Record<StatutRelease, string>` — hex colors for Gantt release bars |

---

## 4. Component Specifications

_No components — this package exports only types and constants._

---

## 5. Internal Architecture

### 5.1 Component Tree

_N/A — no components._

### 5.2 Custom Hooks

_N/A — no hooks._

### 5.3 Helpers / Utilities

| Function | Purpose |
|----------|---------|
| `getTodayString()` | Returns `new Date().toISOString().split("T")[0]` |
| `getPlanCompliance(ms, today?)` | If `dateReelle` exists, compares actual vs planned. Otherwise, if not DONE and `datePrevue` is in the past, returns `"LATE"`. |

---

## 6. Dependencies

### 6.1 Peer Dependencies

_None — this package has zero runtime or peer dependencies._

### 6.2 Internal Dependencies

_None._

### 6.3 Dev Dependencies

| Package | Purpose |
|---------|---------|
| tsup 8.5.0 | TypeScript bundler |
| typescript 5.8.3 | Type checking and compilation |

---

## 7. Build & Configuration

### 7.1 Build

```bash
npm run build        # tsup → dist/index.js + dist/index.mjs
npm run dev          # tsup --watch
npm run clean        # rm -rf dist
```

Output:
```
dist/
├── index.js         # CJS
├── index.mjs        # ESM
├── index.d.ts       # CJS type declarations
└── index.d.mts      # ESM type declarations
```

### 7.2 Package.json Key Fields

```json
{
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.mts",
        "default": "./dist/index.mjs"
      },
      "require": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    }
  }
}
```

### 7.3 TypeScript Configuration

- target: ES2017
- module: esnext, moduleResolution: bundler
- jsx: react-jsx
- strict: true, noEmit: true

### 7.4 tsup Configuration

- Entry: `src/index.ts`
- Format: ESM + CJS
- DTS: false (type declarations generated separately)
- Sourcemap: true
- Clean: true

---

## 8. Testing

_No tests. This package contains only type definitions and pure constants/functions._

---

## 9. Storybook

_No Storybook stories. Types-only package._

---

## 10. Consuming the Library

### 10.1 Installation

```json
{
  "dependencies": {
    "sweet-types": "file:../sweet-types"
  }
}
```

### 10.2 Usage Example

```typescript
import type { Release, StatutRelease, Livrable } from 'sweet-types';
import { RELEASE_BAR_COLORS, getPlanCompliance } from 'sweet-types';

const color = RELEASE_BAR_COLORS[release.statut];
const compliance = getPlanCompliance(milestone);
```

### 10.3 SSR Considerations

No SSR restrictions. This package contains only types and pure functions with no DOM or browser dependencies.

---

## 11. Known Limitations

- Not published to npm — file: reference only
- No database-level validation — types mirror backend entities but are not auto-generated from Java sources
- Must be built before consuming packages (sweet-gantt, sweet-releaseGrid, sweet-frontend)
- tsup `dts: false` means type declarations rely on TypeScript project references; consuming packages must have compatible tsconfig
