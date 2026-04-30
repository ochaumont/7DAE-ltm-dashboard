# UI Component Specification — TableToolbar

> Specification for the combined search + export + column settings toolbar used above every DataTable.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | TableToolbar |
| File Path | src/components/ui/TableToolbar.tsx |
| Type | Generic |
| Complexity | Complex (354 lines) |
| Status | Stable |

---

## 2. Purpose

TableToolbar provides a unified toolbar bar above every DataTable instance. It combines a search input for text filtering, an Excel export button, and a settings gear popup for column visibility, column reorder (via drag-and-drop), and rows-per-page configuration. The settings popup follows a draft/apply/cancel pattern: opening copies live state into draft, Apply commits changes, Cancel discards them.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| filterTerm | `string` | Current search/filter text |
| onFilterChange | `(term: string) => void` | Callback when search text changes |
| placeholder | `string` | Placeholder text for the search input |
| onExport | `() => void` | Triggered when the Excel export button is clicked |
| settingsOpen | `boolean` | Whether the settings popup is currently visible |
| onOpenSettings | `() => void` | Opens the settings popup (copies live state to draft) |
| onApplySettings | `() => void` | Commits draft settings to live state and closes the popup |
| onCancelSettings | `() => void` | Discards draft changes and closes the popup |
| draftRowsPerPage | `number` | Draft value for rows-per-page (editable in the popup) |
| onDraftRowsPerPageChange | `(n: number) => void` | Updates the draft rows-per-page value |
| toggleableColumns | `{ key: string; header: string }[]` | Columns that can be shown/hidden (excludes "nom" and "actions") |
| draftVisibleColumns | `Set<string>` | Set of currently visible column keys (draft state) |
| onToggleDraftColumn | `(key: string) => void` | Toggles a column's visibility in draft state |

### 3.2 Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| draftColumnOrder | `string[]` | `undefined` | Ordered list of all column keys for drag-and-drop reordering |
| onMoveDraftColumn | `(fromIndex: number, toIndex: number) => void` | `undefined` | Moves a column from one index to another in the draft order |
| allColumnHeaders | `Record<string, string>` | `undefined` | Map of column key to translated header label for display in DnD mode |
| extraControls | `React.ReactNode` | `undefined` | Additional controls rendered between the search input and export button |
| extraSettingsContent | `React.ReactNode` | `undefined` | Extra content rendered inside the settings popup, after column toggles and before Apply/Cancel |

### 3.3 Sub-Types

```typescript
// Internal sub-component: SortableColumnRow
// A single row in the DnD column reorder list.
// Renders a drag handle (GripVertical), column label, and visibility toggle or lock icon.
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Simple mode | Column toggles as checkbox list (no drag-and-drop) | `draftColumnOrder`, `onMoveDraftColumn`, and `allColumnHeaders` are NOT all provided |
| DnD mode | Column reorder via sortable drag handles + visibility toggles | All three DnD props provided |
| With extra controls | Additional buttons/dropdowns between search and export | `extraControls` prop provided |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Search | Type in search input | Calls `onFilterChange` on every keystroke |
| Export | Click spreadsheet icon | Calls `onExport` |
| Open settings | Click gear icon | Calls `onOpenSettings` (copies live to draft) |
| Toggle column | Click toggle switch in popup | Calls `onToggleDraftColumn(key)` |
| Reorder column | Drag grip handle in DnD mode | Calls `onMoveDraftColumn(fromIndex, toIndex)` |
| Change rows/page | Edit number input (1-20) | Calls `onDraftRowsPerPageChange` with clamped value |
| Apply | Click Apply button | Calls `onApplySettings` (commits draft to live) |
| Cancel | Click Cancel button | Calls `onCancelSettings` (discards draft) |

### 5.2 Internal State

This component has no internal state. All state is managed by the parent via the `useTableSettings` hook.

### 5.3 Special Column Rules

| Column Key | Behavior |
|------------|----------|
| `nom` | Always visible; no toggle switch rendered (label shown as always-on) |
| `actions` | Shows a Lock icon instead of a toggle (cannot be hidden) |
| Others | Toggle switch (indigo when visible, gray when hidden) |

### 5.4 DnD Configuration

- Uses `@dnd-kit/core` with `PointerSensor` and a 5px distance activation constraint to prevent accidental drags when clicking toggles.
- Uses `@dnd-kit/sortable` with `verticalListSortingStrategy`.
- Each row renders a `GripVertical` drag handle.

---

## 6. Visual Specification

### 6.1 Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [Search input]              [extraControls] [Export] [Gear]  │
└──────────────────────────────────────────────────────────────┘
                                                       |
                                Settings popup (absolute, z-50) v
                                ┌────────────────────────────┐
                                │ Table Settings             │
                                │ Rows per page: [__10__]    │
                                │ ─────────────────────────  │
                                │ Visible columns:           │
                                │ = Name          (always)   │
                                │ = Status        [toggle]   │
                                │ = Description   [toggle]   │
                                │ = Actions       [lock]     │
                                │          [Cancel] [Apply]  │
                                └────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Container | `flex items-center justify-between px-6 py-3` |
| Search input | `pl-9 pr-3 py-2 w-64 rounded-md border border-gray-300 text-sm` |
| Search icon | `Search` from lucide, absolute left-3, text-gray-400 |
| Export button | `p-1.5 rounded hover:bg-gray-100 text-gray-500` |
| Settings button | `p-1.5 rounded hover:bg-gray-100 text-gray-500` |
| Settings popup | `absolute right-0 top-9 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-72` |
| Toggle switch (on) | `bg-indigo-600` with white knob `translate-x-4` |
| Toggle switch (off) | `bg-gray-300` with white knob `translate-x-0.5` |
| DnD row | `flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-100 bg-white mb-1` |
| Apply button | `bg-indigo-600 text-white rounded-md hover:bg-indigo-700` |
| Cancel button | `text-gray-600 rounded-md hover:bg-gray-100` |

---

## 7. Usage Examples

### 7.1 Basic Usage (with useTableSettings hook)

```tsx
const { visibleColumns, columnOrder, settingsOpen, draftRowsPerPage, ... } = useTableSettings(
  defaultVisibleColumns,
  10,
  defaultColumnOrder,
  "produits"
);

<TableToolbar
  filterTerm={searchTerm}
  onFilterChange={setSearchTerm}
  placeholder="Search products..."
  onExport={handleExport}
  settingsOpen={settingsOpen}
  onOpenSettings={openSettings}
  onApplySettings={applySettings}
  onCancelSettings={cancelSettings}
  draftRowsPerPage={draftRowsPerPage}
  onDraftRowsPerPageChange={setDraftRowsPerPage}
  toggleableColumns={toggleableColumns}
  draftVisibleColumns={draftVisibleColumns}
  onToggleDraftColumn={toggleDraftColumn}
  draftColumnOrder={draftColumnOrder}
  onMoveDraftColumn={moveDraftColumn}
  allColumnHeaders={allColumnHeaders}
/>
```

### 7.2 With Extra Controls

```tsx
<TableToolbar
  {...toolbarProps}
  extraControls={<FilterDropdown value={statusFilter} onChange={setStatusFilter} options={statusOptions} />}
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| @dnd-kit/core | External | DndContext, closestCenter, PointerSensor |
| @dnd-kit/sortable | External | SortableContext, verticalListSortingStrategy, useSortable |
| @dnd-kit/utilities | External | CSS.Transform for drag transform styles |
| lucide-react | External | Search, FileSpreadsheet, Settings, GripVertical, Lock icons |
| react-i18next | External | Translation of labels and buttons |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Export button | `title` and `aria-label` for tooltip and screen readers |
| Settings button | `title` and `aria-label` for tooltip and screen readers |
| DnD drag handle | `aria-label="Drag to reorder"` on grip button |
| Focus | Standard focus outlines on search input and buttons |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Full toolbar with search, controls, export, and settings |
| Tablet/Mobile | Search input has fixed `w-64`, settings popup `w-72` positioned absolutely |

---

## 11. Known Limitations

- Settings popup is not a true modal; it does not trap focus or handle Escape to close.
- No click-outside handler to close the settings popup; relies on Cancel/Apply buttons.
- Rows-per-page is clamped to 1-20 range.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Produits list | Search + export + column settings for product table |
| Projets list | Search + export + column settings for project tree table |
| Ressources list | Search + export + column settings for resource table |
| Various detail tabs | Tables in milestone, phase, livrable, risque tabs |
