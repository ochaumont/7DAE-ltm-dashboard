# Shared Library Specification — sweet-gantt

> Specification for an internal shared library/package: purpose, public API, components, build configuration, and usage.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Package Name | sweet-gantt |
| Directory | sweet-gantt/ |
| Version | 0.1.0 |
| Private | Yes |
| Status | Stable |

---

## 2. Purpose

Interactive Gantt chart component library providing ProductGantt and ProjectGantt components. Supports drag-to-move, drag-to-resize, view modes (week/month/quarter/year), milestone markers, livrable sub-rows, resizable left panel, and SVG/PNG export. Used on the product detail RoadmapTab and project detail GanttTab.

---

## 3. Public API (Exports)

### 3.1 Components

| Export | Type | Description |
|--------|------|-------------|
| `ProductGantt` | React Component | Gantt chart for product releases with drag-to-move/resize bars |
| `ProjectGantt` | React Component | Gantt chart for project phases and milestones |
| `BaseGantt` | React Component | Shared base Gantt rendering engine (used internally by both) |
| `default` | React Component | Alias for ProductGantt (backward compatibility) |

### 3.2 Hooks

| Export | Description |
|--------|-------------|
| `useGanttSettings` | Manages Gantt display settings (view mode, toggles) |
| `useGanttExport` | Export chart to SVG/PNG/JPG via html-to-image |
| `useGanttDragScroll` | Auto-scroll the chart area during drag operations |
| `useDragMilestone` | Drag interaction for milestone diamond markers |
| `useDragLivrable` | Drag interaction for livrable sub-row bars |

### 3.3 Types

| Export | Description |
|--------|-------------|
| `ViewMode` | Union type: `"week" \| "month" \| "quarter" \| "year"` |
| `TickGroup` | Interface for time axis tick group with sub-ticks |
| `BaseGanttProps` | Props interface for the BaseGantt component |
| `BaseGanttContext` | Context type for BaseGantt internals |
| `GanttSettings` | Settings interface for useGanttSettings hook |
| `ProjectGanttProps` | Props interface for ProjectGantt |
| `ProjectTooltipData` | Tooltip data structure for project Gantt |
| `ProductGanttProps` | Props interface for ProductGantt |
| `ProductTooltipData` | Tooltip data structure for product Gantt |
| `DragMode` | Union type: `"move" \| "resize-left" \| "resize-right"` (from types.ts) |
| `DragState` | Interface for drag operation state (from types.ts) |

### 3.4 Utilities

| Export | Description |
|----------|---------|
| `parseDate(str)` | Safely parse a date string, returning null for invalid/missing values |
| `dateToPercent(date, config)` | Convert a date to percentage position on the timeline |
| `percentToDate(pct, config)` | Convert a percentage position back to a date |
| `toISODateStr(date)` | Format a Date to ISO date string (YYYY-MM-DD) |
| `getViewWindow(viewMode, offset)` | Compute the visible time window for a given view mode and offset |
| `buildTickGroups(viewMode, window)` | Generate axis tick groups for rendering column headers |

### 3.5 Constants

| Export | Description |
|----------|---------|
| `LEFT_PANEL_WIDTH` | 320 — width of the left entity list panel |
| `YEAR_ROW_H` | 24 — height of the year row in the header |
| `PERIOD_ROW_H` | 28 — height of the period row in the header |
| `HEADER_HEIGHT` | 52 — total header height (YEAR_ROW_H + PERIOD_ROW_H) |
| `ROW_HEIGHT` | 48 — height of a main entity row |
| `SUB_ROW_HEIGHT` | 28 — height of a livrable sub-row |
| `CHART_MIN_WIDTH` | 800 — minimum chart area width |
| `STEPS_PER_VIEW` | `Record<ViewMode, number>` — navigation steps per view mode |
| `DRAG_SCROLL_ANIMATION_MS` | 300 — animation duration for drag scroll |

---

## 4. Component Specifications

### 4.1 ProductGantt

**Props:** Defined in `ProductGanttProps` (src/ProductGantt/types.ts)

**Features:**
- Horizontal bars per release, colored by release status (uses `RELEASE_BAR_COLORS` from sweet-types)
- Drag-to-move bars horizontally (changes start/end dates)
- Drag-to-resize bars from left or right edge
- Expandable livrable sub-rows under each release
- Milestone diamond markers on the timeline
- View modes: week, month, quarter, year
- Resizable left panel showing entity list
- SVG/PNG/JPG export via html-to-image
- Auto-scroll during drag near chart edges

### 4.2 ProjectGantt

**Props:** Defined in `ProjectGanttProps` (src/ProjectGantt/types.ts)

**Features:**
- Horizontal bars per project phase, colored by phase status (uses `PHASE_BAR_COLORS` from sweet-types)
- Drag-to-move and drag-to-resize phase bars
- Milestone diamond markers (draggable)
- Livrable sub-rows linked to phases
- Same view modes and controls as ProductGantt

### 4.3 BaseGantt

Shared rendering engine consumed by ProductGantt and ProjectGantt. Handles:
- Timeline header with year and period rows
- Grid background and today-line
- Row layout and scrolling
- Settings and controls integration

**Internal Structure:**

```
sweet-gantt/src/
├── index.tsx                  # Main exports + "use client" + CSS import
├── types.ts                   # DragMode, DragState types
├── styles.css                 # Component styles (Tailwind 4)
├── i18n.tsx                   # Internal i18n setup with fallback provider
├── Gantt.stories.tsx          # Storybook stories
├── Badge/                     # Badge sub-component for status display
├── BaseGantt/                 # Shared base Gantt engine + useGanttSettings hook
├── gantt/
│   ├── helpers.ts             # Pure date/pixel utility functions
│   └── types.ts               # ViewMode, TickGroup, layout constants
├── GanttControls/             # View mode selector, navigation, settings panel
├── GanttLeftPanel.tsx         # Left-side entity list with resizable width
├── LivrableSubRows.tsx        # Expandable livrable rows under releases/phases
├── MilestonesTrack/           # Milestone diamond markers on timeline
├── ProductGantt/              # Product-specific Gantt (types.ts + component)
├── ProjectGantt/              # Project-specific Gantt (types.ts + component)
├── useDragBar.ts              # Drag-to-move/resize for release bars
├── useDragBarGeneric.ts       # Generic drag bar hook
├── useDragLivrable.ts         # Livrable-specific drag interaction
├── useDragMilestone.ts        # Milestone diamond drag interaction
├── useDragPhaseBar.ts         # Phase bar drag interaction
├── useDragPointGeneric.ts     # Generic point drag hook
├── useGanttDragScroll.ts      # Auto-scroll during drag near edges
├── useGanttExport.ts          # SVG/PNG/JPG export via html-to-image
├── useResizablePanel.ts       # Resizable left panel hook
└── test/
    └── setup.ts               # Vitest test setup
```

---

## 5. Internal Architecture

### 5.1 Component Tree

```
<ProductGantt>                      <ProjectGantt>
  ├── <BaseGantt>                     ├── <BaseGantt>
  │   ├── <GanttControls />           │   ├── <GanttControls />
  │   ├── <GanttLeftPanel />          │   ├── <GanttLeftPanel />
  │   ├── Timeline Header (SVG)       │   ├── Timeline Header (SVG)
  │   ├── Release Bars (SVG)          │   ├── Phase Bars (SVG)
  │   ├── <LivrableSubRows />         │   ├── <LivrableSubRows />
  │   └── <MilestonesTrack />         │   └── <MilestonesTrack />
  └── Settings Popup                  └── Settings Popup
```

### 5.2 Custom Hooks

| Hook | Purpose | State Managed |
|------|---------|---------------|
| `useGanttSettings` | Manages view mode, toggles, navigation offset | `GanttSettings` |
| `useDragBar` | Handles mouse drag on release Gantt bars | `DragState`, position |
| `useDragBarGeneric` | Generic version for any horizontal bar | `DragState`, position |
| `useDragLivrable` | Livrable sub-row bar dragging | drag position |
| `useDragMilestone` | Milestone diamond dragging | drag position |
| `useDragPhaseBar` | Phase bar dragging in ProjectGantt | `DragState`, position |
| `useDragPointGeneric` | Generic single-point drag | drag position |
| `useGanttDragScroll` | Auto-scrolls chart when dragging near edges | scroll state |
| `useGanttExport` | Exports chart area to image file | export state |
| `useResizablePanel` | Resizable left panel sidebar | panelWidth |

### 5.3 Helpers / Utilities

| Function | Purpose |
|----------|---------|
| `parseDate(str)` | Safely parse date string to Date or null |
| `dateToPercent(date, window)` | Convert date to % X position within the visible time window |
| `percentToDate(pct, window)` | Convert % X position back to a date |
| `toISODateStr(date)` | Format Date to "YYYY-MM-DD" |
| `getViewWindow(viewMode, offset)` | Compute start/end dates for the visible chart area |
| `buildTickGroups(viewMode, window)` | Generate year/month/quarter/week tick groups for the header |

---

## 6. Dependencies

### 6.1 Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | >= 18 | React runtime |
| react-dom | >= 18 | DOM rendering |
| date-fns | >= 3 | Date manipulation (intervals, formatting) |
| clsx | >= 2 | Classname utility |
| lucide-react | >= 0.300 | Icon components |
| react-i18next | >= 15 | Translation support |
| sweet-types | * | Shared TypeScript types and constants |

### 6.2 Internal Dependencies

| Package | Purpose |
|---------|---------|
| sweet-types | Entity types (Release, Milestone, Livrable, ProjectPhase) and color maps |

### 6.3 Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| html-to-image | 1.11.13 | PNG/JPG/SVG export of the chart DOM |

### 6.4 Dev Dependencies

| Package | Purpose |
|---------|---------|
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
- DTS: false
- External: react, react-dom, lucide-react, react-i18next, date-fns, sweet-types, clsx
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
| Helpers (parseDate, dateToPercent, etc.) | Unit tests | Minimal |
| Hooks (useDragBar, etc.) | — | Not covered |
| Components (ProductGantt, ProjectGantt) | — | Not covered |

---

## 9. Storybook

### 9.1 Stories

| Story | File | Description |
|-------|------|-------------|
| Gantt stories | `src/Gantt.stories.tsx` | ProductGantt and ProjectGantt with sample data |

### 9.2 Running Storybook

```bash
# From project root
./sh/storybook.sh dev    # Dev server on port 6006
./sh/storybook.sh build  # Build static Storybook
```

Storybook config lives in `storybook/.storybook/` and includes sweet-gantt and sweet-releaseGrid.

---

## 10. Consuming the Library

### 10.1 Installation

```json
{
  "dependencies": {
    "sweet-gantt": "file:../sweet-gantt"
  }
}
```

### 10.2 Usage Example

```tsx
import { ProductGantt } from 'sweet-gantt';
import 'sweet-gantt/style.css';

<ProductGantt
  releases={releases}
  milestones={milestones}
  livrables={livrables}
  onDateChange={handleDateChange}
/>
```

### 10.3 SSR Considerations

This library depends on DOM APIs for drag interactions and html-to-image for export. It **must** be loaded with SSR disabled in Next.js:

```tsx
import dynamic from 'next/dynamic';

const ProductGantt = dynamic(
  () => import('sweet-gantt').then(m => m.ProductGantt),
  { ssr: false }
);
```

The tsup build prepends `"use client";` to all output files as an additional safeguard.

---

## 11. Known Limitations

- Not published to npm — file: reference only
- No virtual scrolling — may degrade with very large numbers of releases/phases
- Requires CSS import (`sweet-gantt/style.css`) from consuming app
- Must be built after sweet-types in the dependency chain
- Drag interactions require mouse/pointer events — no touch-optimized handling
- Export to image (html-to-image) requires the chart to be fully rendered in the DOM
