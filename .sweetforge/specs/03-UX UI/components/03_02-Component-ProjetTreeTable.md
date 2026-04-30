# UI Component Specification — ProjetTreeTable

> Specification for the hierarchical tree table displaying projects and work packages with expand/collapse.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | ProjetTreeTable |
| File Path | src/components/ui/ProjetTreeTable.tsx |
| Type | Domain-specific |
| Complexity | Complex (350 lines) |
| Status | Stable |

---

## 2. Purpose

ProjetTreeTable renders a hierarchical table of projects and their child work packages. It builds a tree structure from a flat array using `parentId` references, supports expand/collapse at each level, and provides action buttons (add WP, edit, delete) per row. A `flatMode` prop disables tree nesting for search result display.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| projets | `Projet[]` | Full flat list of projects (tree structure is derived from parentId) |
| visibleColumns | `Set<string>` | Set of visible column keys (nom and actions are always shown) |
| onRowClick | `(p: Projet) => void` | Navigate to project detail page |
| onEdit | `(p: Projet, e: React.MouseEvent) => void` | Open edit modal for a project |
| onDelete | `(p: Projet, e: React.MouseEvent) => void` | Open delete confirmation for a project |
| onAddWorkPackage | `(parent: Projet, e: React.MouseEvent) => void` | Create a child work package under this project |
| emptyMessage | `string` | Message shown when no projects match |

### 3.2 Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| columnOrder | `string[]` | `["nom", "statut", "description", "dateDebut", "dateFinPrevue", "actions"]` | Order of columns for rendering |
| flatMode | `boolean` | `false` | When true, renders all projects as flat rows (no tree nesting) |
| rootParentId | `string \| null` | `null` | parentId value that identifies root-level nodes |

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Tree mode | Hierarchical display with expand/collapse | Default (`flatMode=false`) |
| Flat mode | All projects as flat rows, no indentation | `flatMode={true}` (used in search mode) |
| Empty | Empty message spanning all columns | `displayNodes.length === 0` |
| Expanded parent | Shows child rows below parent | Expand chevron clicked |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Expand/collapse | Click chevron button | Toggles project ID in `expandedIds` Set; shows/hides children |
| Row click | Click row | Calls `onRowClick(projet)` — navigates to detail page |
| Add WP | Click FolderPlus icon | Calls `onAddWorkPackage(parent, event)` (event.stopPropagation) |
| Edit | Click Pencil icon | Calls `onEdit(projet, event)` (event.stopPropagation) |
| Delete | Click Trash icon | Calls `onDelete(projet, event)` (event.stopPropagation) |

### 5.2 Internal State

| State | Type | Purpose |
|-------|------|---------|
| expandedIds | `Set<string>` | Set of currently expanded project IDs |

### 5.3 Tree Building Algorithm

1. Build `childrenByParentId` map from the flat `projets` array using `parentId`.
2. Root projects are those with `parentId === rootParentId` (default: `null`).
3. Both roots and children lists are sorted alphabetically by `nom`.
4. Rendering is recursive: `renderChildren(parentId, depth)` renders all children, then recurses for expanded children.
5. Each depth level adds 24px left padding (`24 + depth * 24`).
6. Empty expanded parents show "No work packages." placeholder.

### 5.4 Column Rendering

Columns are rendered in the order specified by `columnOrder`, filtered to those in `visibleColumns` (plus `nom` and `actions` which are always shown). Supported column keys:

| Key | Renders |
|-----|---------|
| nom | Project name with chevron, child count badge, and indentation |
| statut | Status badge (color-coded by `statutColors` map) |
| description | Truncated description (max-w-200px) |
| dateDebut | Start date (formatted via `useFormatDate`) |
| dateFinPrevue | Planned end date (formatted via `useFormatDate`) |
| actions | FolderPlus + Pencil + Trash buttons |

---

## 6. Visual Specification

### 6.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│  Name          Status     Description  Start    End     │
├─────────────────────────────────────────────────────────┤
│ > Project Alpha (2)  EN_COURS   ...    2024-01  2024-06 │  <- root (bg-gray-50)
│   > WP-Frontend (1)  EN_COURS   ...    2024-02  2024-05 │  <- depth=1 (bg-white)
│     . Task-UI         TERMINE   ...    2024-02  2024-03 │  <- depth=2 (leaf)
│   . WP-Backend       INITIATION ...    2024-03  2024-06 │  <- depth=1 (leaf)
│ > Project Beta (0)   INITIATION ...    2024-04  2024-12 │  <- root
│     (No work packages.)                                  │  <- empty placeholder
└─────────────────────────────────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Table | `min-w-full divide-y divide-gray-200` |
| Header | `bg-gray-50`, `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500` |
| Root row | `bg-gray-50 font-medium cursor-pointer hover:bg-gray-100` |
| Child row | `bg-white cursor-pointer hover:bg-gray-50` |
| Expand chevron | `text-gray-500 hover:text-gray-700 p-0.5` (ChevronRight/ChevronDown) |
| Child count badge | `text-xs text-gray-400 ml-1` |
| Action buttons | `text-gray-400 hover:text-{color}-600` (green/blue/red) |
| Empty placeholder | `text-sm text-gray-400 italic` |
| Status badge | Color-coded: INITIATION=blue, EN_COURS=yellow, TERMINE=green, SUSPENDU=gray |

---

## 7. Usage Examples

### 7.1 Standard Usage

```tsx
<ProjetTreeTable
  projets={allProjets}
  visibleColumns={visibleColumns}
  columnOrder={columnOrder}
  onRowClick={(p) => router.push(`/projets/${p.id}`)}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onAddWorkPackage={handleAddWP}
  emptyMessage="No projects found."
/>
```

### 7.2 Flat Mode (Search Results)

```tsx
<ProjetTreeTable
  projets={filteredProjets}
  visibleColumns={visibleColumns}
  onRowClick={handleRowClick}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onAddWorkPackage={handleAddWP}
  emptyMessage="No results."
  flatMode={true}
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| lucide-react | External | ChevronRight, ChevronDown, Pencil, Trash2, FolderPlus icons |
| react-i18next | External | Translation of column headers and labels |
| Badge | Internal | Status display in statut column |
| getProjetDisplayName | Internal | Display name formatting from constants.ts |
| useFormatDate | Internal | Locale-aware date formatting hook |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Expand/collapse | `aria-label="Collapse"` / `"Expand"` on chevron button |
| Action toolbar | `role="toolbar"` on actions cell container with `onClick/onKeyDown` stopPropagation |
| Action buttons | `title` and `aria-label` on each action button |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Full table with all visible columns |
| Tablet/Mobile | Horizontal scroll via `overflow-x-auto` container |

---

## 11. Known Limitations

- No sorting — rows are always sorted alphabetically by name within each level.
- No pagination — all projects are rendered.
- Expand/collapse state is local (not persisted across navigation).
- Description column truncated at `max-w-[200px]` with `truncate` class.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Projets list page | Main hierarchical project table |
| Project detail > WorkpackagesTab | Work package tree within a project |
