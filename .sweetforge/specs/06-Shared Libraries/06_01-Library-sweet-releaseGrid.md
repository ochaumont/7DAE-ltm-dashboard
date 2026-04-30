# Shared Library Specification — sweet-release-grid

> Specification for an internal shared library/package: purpose, public API, components, build configuration, and usage.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Package Name | sweet-release-grid |
| Directory | sweet-releaseGrid/ |
| Version | 0.1.0 |
| Private | Yes |
| Status | Stable |

---

## 2. Purpose

Hierarchical release-to-livrable grid with drag-and-drop support for moving livrables between releases. Displays releases as expandable parent rows with livrables as draggable child rows. Used on the product detail page (ReleasesTab) and release detail page.

---

## 3. Public API (Exports)

### 3.1 Components

| Export | Type | Description |
|--------|------|-------------|
| `ReleaseGrid` (default) | React Component | Main hierarchical grid with DnD support |

### 3.2 Hooks

_No hooks exported._

### 3.3 Types

| Export | Description |
|--------|-------------|
| `ReleaseGridProps` | Props interface for the ReleaseGrid component |
| `AssignmentEntry` | Type: `{ ressourceId: string; pourcentage: number; id: string }` |
| `TFunction` | Translation function type shared by sub-components |
| `PriorityIcon` | Function component mapping priority to a colored arrow icon |
| `Release` | Re-exported from sweet-types |
| `Livrable` | Re-exported from sweet-types |
| `Priorite` | Re-exported from sweet-types |

### 3.4 Utilities

| Export | Description |
|----------|---------|
| `computeWeightedProgress(livrables)` | Compute weighted average progress across non-cancelled livrables (weight = estimationCharge). Returns percentage string or "N/A". |

---

## 4. Component Specifications

### 4.1 ReleaseGrid

**Props:**

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `releases` | `Release[]` | Yes | — | Ordered list of releases (each becomes a droppable row) |
| `livrablesByRelease` | `Map<string, Livrable[]>` | Yes | — | Map of releaseId to livrables (draggable child rows) |
| `onReleaseClick` | `(release) => void` | No | — | Navigate to release detail page |
| `onReleaseEdit` | `(release, e) => void` | No | — | Open edit modal for a release |
| `onReleaseDelete` | `(release, e) => void` | No | — | Open delete confirmation |
| `onMarkDelivered` | `(release, e) => void` | No | — | Mark release as delivered (RG-07 check in parent) |
| `onLivrableCreate` | `(releaseId) => void` | No | — | Open create livrable modal for a release |
| `onLivrableEdit` | `(livrable, e) => void` | No | — | Open edit modal for a livrable |
| `onLivrableDelete` | `(livrable, e) => void` | No | — | Open delete confirmation |
| `onLivrableMove` | `(livrableId, fromReleaseId, toReleaseId) => void` | No | — | Called when a livrable is DnD-dropped onto a different release |
| `expandedLivrableIds` | `Set<string>` | No | — | Set of livrable IDs whose assignment sub-rows are expanded |
| `onLivrableToggle` | `(livrable) => void` | No | — | Toggle livrable expanded state |
| `onAssignmentClick` | `(livrable, e) => void` | No | — | Open assignment modal |
| `assignmentsByLivrable` | `Map<string, AssignmentEntry[]>` | No | — | Assignment entries per livrable (shown in expanded sub-rows) |
| `ressourceMap` | `Record<string, { prenom, nom }>` | No | — | Resource name lookup |
| `visibleColumns` | `Set<string>` | No | all | Set of visible column keys |
| `columnOrder` | `string[]` | No | default order | Ordered column keys for rendering |

**Column Keys:** `nameVersion`, `dateDebut`, `dateLivraisonPrevue`, `dateLivraisonReelle`, `statut`, `effort`, `progress`, `description`, `actions`

**Features:**
- Hierarchical display: releases as parent rows, livrables as child rows
- Expand/collapse release rows to show/hide livrables
- @dnd-kit drag-and-drop: drag livrables between releases via grip handle
- 5px distance activation constraint prevents accidental drags when clicking buttons
- Drag overlay shows livrable name + priority icon + status badge
- Expandable livrable sub-rows show assigned resources with percentage bars
- Weighted progress computation per release (charge-weighted average)
- Priority icons: red arrow up (HAUTE), yellow dash (MOYENNE), green arrow down (BASSE)
- Status badges using `LIV_STATUT_COLORS` and `RELEASE_STATUT_COLORS` from sweet-types
- Column visibility and ordering controlled via props (supports DnD reorder from parent)
- Empty state message when no releases exist

**Internal Structure:**

```
sweet-releaseGrid/src/
├── index.tsx                      # Main ReleaseGrid component + default export
├── types.tsx                      # ReleaseGridProps, AssignmentEntry, PriorityIcon
├── helpers.ts                     # computeWeightedProgress utility
├── styles.css                     # Component styles (Tailwind 4)
├── i18n.tsx                       # Internal i18n setup with fallback provider
├── ReleaseGrid.stories.tsx        # Storybook stories
├── Badge/                         # Badge sub-component for status display
├── DraggableLivrableRow/          # Livrable row with useDraggable hook + grip handle
├── DroppableReleaseRow/           # Release row with useDroppable hook + highlight on hover
└── test/
    └── setup.ts                   # Vitest test setup
```

---

## 5. Internal Architecture

### 5.1 Component Tree

```
<ReleaseGrid>
  └── <I18nFallback>
      └── <ReleaseGridInner>
          └── <DndContext sensors={[PointerSensor, KeyboardSensor]}>
              ├── <table>
              │   ├── <thead> (column headers from effectiveOrder)
              │   └── <tbody>
              │       ├── <DroppableReleaseRow />     (per release, droppable zone)
              │       ├── <DraggableLivrableRow />    (per livrable, when expanded)
              │       └── Empty state row              (when expanded + no livrables)
              └── <DragOverlay>
                  └── Badge + PriorityIcon + name     (shown while dragging)
```

### 5.2 Custom Hooks

_No custom hooks exported. Sub-components use @dnd-kit's `useDroppable` and `useDraggable` hooks internally._

### 5.3 Helpers / Utilities

| Function | Purpose |
|----------|---------|
| `computeWeightedProgress(livrables)` | Weighted average progress excluding ANNULE livrables. Weight = estimationCharge. Returns "N/A" if any livrable lacks valid charge/progress. |

---

## 6. Dependencies

### 6.1 Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | >= 18 | React runtime |
| react-dom | >= 18 | DOM rendering |
| @dnd-kit/core | >= 6 | Drag-and-drop framework |
| clsx | >= 2 | Classname utility |
| lucide-react | >= 0.300 | Icon components (arrows, chevrons, grip) |
| react-i18next | >= 15 | Translation support |
| sweet-types | * | Shared TypeScript types and constants |

### 6.2 Internal Dependencies

| Package | Purpose |
|---------|---------|
| sweet-types | Entity types (Release, Livrable, Priorite) and color maps (LIV_STATUT_COLORS) |

### 6.3 Dev Dependencies

| Package | Purpose |
|---------|---------|
| @dnd-kit/core 6.3.1 | DnD framework (also a peer dep, installed for dev) |
| tsup 8.5.0 | TypeScript bundler |
| typescript 5.8.3 | Type checking |
| vitest 4.1.2 | Testing framework |
| tailwindcss 4 | CSS utility framework |
| @storybook/addon-actions | Storybook action logging |
| @testing-library/react | Component testing utilities |
| @testing-library/jest-dom | DOM assertion matchers |
| @vitejs/plugin-react | Vite React plugin for tests |
| jsdom | DOM environment for tests |

---

## 7. Build & Configuration

### 7.1 Build

```bash
npm run build        # tsup → dist/
npm run dev          # tsup --watch
npm run clean        # rm -rf dist
npm run test         # vitest run
```

Output:
```
dist/
├── index.js         # CJS
├── index.mjs        # ESM
├── index.d.ts       # CJS type declarations
├── index.d.mts      # ESM type declarations
└── index.css        # Bundled component styles
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
    },
    "./style.css": "./dist/index.css"
  }
}
```

### 7.3 TypeScript Configuration

- target: ES2017
- module: esnext, moduleResolution: bundler
- jsx: react-jsx
- strict: true, noEmit: true

### 7.4 tsup Configuration

- Entry: `src/index.tsx`
- Format: ESM + CJS
- DTS: true (generates type declarations)
- External: react, react-dom, lucide-react, react-i18next, @dnd-kit/core, sweet-types, clsx
- Banner: `"use client";` prepended to all JS output
- Sourcemap: true, Clean: true

---

## 8. Testing

### 8.1 Test Setup

- **Framework**: Vitest 4.1.2
- **DOM environment**: jsdom
- **Setup file**: `src/test/setup.ts`

### 8.2 Test Coverage

| Area | Tests | Status |
|------|-------|--------|
| Helpers (computeWeightedProgress) | — | Not covered |
| Components (ReleaseGrid) | — | Not covered |
| Sub-components (DraggableLivrableRow, DroppableReleaseRow) | — | Not covered |

---

## 9. Storybook

### 9.1 Stories

| Story | File | Description |
|-------|------|-------------|
| ReleaseGrid stories | `src/ReleaseGrid.stories.tsx` | Hierarchical grid with sample releases and livrables |

### 9.2 Running Storybook

```bash
# From project root
./sh/storybook.sh dev    # Dev server on port 6006
./sh/storybook.sh build  # Build static Storybook
```

---

## 10. Consuming the Library

### 10.1 Installation

```json
{
  "dependencies": {
    "sweet-release-grid": "file:../sweet-releaseGrid"
  }
}
```

Note: The npm package name is `sweet-release-grid` (hyphenated) while the directory is `sweet-releaseGrid` (camelCase).

### 10.2 Usage Example

```tsx
import ReleaseGrid from 'sweet-release-grid';
import 'sweet-release-grid/style.css';

<ReleaseGrid
  releases={releases}
  livrablesByRelease={livrableMap}
  onReleaseClick={handleReleaseClick}
  onLivrableMove={handleLivrableMove}
  visibleColumns={visibleCols}
  columnOrder={colOrder}
/>
```

### 10.3 SSR Considerations

Does **not** need `{ ssr: false }` on its own — the parent page (ProduitDetail) handles SSR exclusion for the tab that contains it. The @dnd-kit library works in both SSR and client environments, and the `"use client"` banner in the build output ensures Next.js treats it as a client component.

---

## 11. Known Limitations

- Not published to npm — file: reference only
- No virtual scrolling — performance may degrade with very large numbers of releases/livrables
- Requires CSS import (`sweet-release-grid/style.css`) from consuming app
- Must be built after sweet-types in the dependency chain
- Column reordering is controlled by the parent (via `columnOrder` prop), not internally
- DnD only supports moving livrables between releases, not reordering within a release
