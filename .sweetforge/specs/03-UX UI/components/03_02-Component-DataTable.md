# UI Component Specification — DataTable

> Specification for the generic sortable, paginated data table used by all list pages and detail tabs.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | DataTable\<T\> |
| File Path | src/components/ui/DataTable.tsx |
| Type | Generic |
| Complexity | Complex (310 lines) |
| Status | Stable |

---

## 2. Purpose

DataTable is the universal table component used across the entire application. It renders a typed array of items as a sortable, optionally paginated HTML table with support for expandable rows. All list pages (produits, projets, ressources) and most detail page tabs delegate their tabular display to this component.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| columns | `Column<T>[]` | Column definitions — order determines display order |
| data | `T[]` | Full dataset; sorting and pagination are applied internally |

### 3.2 Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| onRowClick | `(item: T) => void` | `undefined` | Row click handler — typically navigates to a detail page |
| emptyMessage | `string` | `t("dataTable.noData")` | Message shown when data array is empty |
| defaultSortKey | `string` | `null` | Column key to sort by on initial render |
| defaultSortDirection | `"asc" \| "desc"` | `"asc"` | Initial sort direction |
| pageSize | `number` | `undefined` | Enables pagination when set; value is rows per page (1-20) |
| expandedContent | `(item: T) => ReactNode \| null` | `undefined` | Returns extra JSX to render in an expanded row beneath an item; return null to collapse |

### 3.3 Sub-Types

```typescript
export interface Column<T> {
  /** Unique identifier used as React key and to match sort state */
  key: string;
  /** Displayed header text (translated by the caller) */
  header: string;
  /** Custom cell renderer; falls back to item[key] if omitted */
  render?: (item: T) => ReactNode;
  /** Extra CSS classes applied to both <th> and <td> */
  className?: string;
  /** Whether clicking the header toggles sort on this column */
  sortable?: boolean;
  /** Extracts a comparable value for sorting; defaults to item[key] */
  sortValue?: (item: T) => string | number;
  /** Secondary sort extractor used when primary values are equal */
  tiebreaker?: (item: T) => string | number;
}
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Default | Standard table with sorting | Default state |
| Paginated | With Previous/Next controls and page indicator | `pageSize` prop provided |
| Expandable | Extra content row below each item | `expandedContent` prop provided |
| Empty | "No data" message spanning all columns | `data.length === 0` |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Sort | Click column header | Same key: toggle asc/desc. New key: set key + asc |
| Paginate | Click Previous/Next | Change page, update displayed rows |
| Row click | Click row | Calls `onRowClick(item)` if provided |
| Expand row | Provided by `expandedContent` callback | Renders extra `<tr>` below the item row |

### 5.2 Internal State

| State | Type | Purpose |
|-------|------|---------|
| sortKey | `string \| null` | Currently sorted column key |
| sortDirection | `"asc" \| "desc"` | Current sort direction |
| currentPage | `number` | Active page (1-based), reset to 1 on data/pageSize change |

### 5.3 Keyboard Support

| Key | Action |
|-----|--------|
| Tab | Navigate between sortable headers |
| Enter / Space | Toggle sort on focused header |

### 5.4 Sort Algorithm

- Uses `useMemo` to recompute `sortedData` when data, sortKey, sortDirection, or columns change.
- `compareValues()` utility handles null-safe comparison: nulls always sink to the bottom regardless of direction.
- Numbers compared numerically; strings compared via `localeCompare`.
- When primary values are equal and a `tiebreaker` extractor is defined, it is used as a secondary sort key.

### 5.5 Pagination Flow

- `sortedData` is sliced by `(currentPage - 1) * pageSize` to `currentPage * pageSize`.
- `currentPage` resets to 1 via `useEffect` whenever `data` or `pageSize` changes.
- Pagination controls only render when `pageSize` is set and `totalPages > 1`.

---

## 6. Visual Specification

### 6.1 Layout

```
┌─────────────────────────────────────────────────────┐
│  Header: [Col A ^] [Col B ⇅] [Col C ⇅] [Actions]  │  <- <thead>
├─────────────────────────────────────────────────────┤
│  Row 1                                              │  <- <tr> (clickable if onRowClick)
│    +-- expanded content (optional)                  │  <- shown if expandedContent(item)
│  Row 2                                              │
│  ...                                                │
├─────────────────────────────────────────────────────┤
│  Page 1 of 3 (15 items)        [Previous] [Next]   │  <- pagination (only if pageSize)
└─────────────────────────────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Container | `overflow-x-auto` |
| Table | `min-w-full divide-y divide-gray-200` |
| Header row | `bg-gray-50` |
| Header cell | `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500` |
| Sortable header | `cursor-pointer select-none hover:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-inset` |
| Body cell | `whitespace-nowrap px-6 py-4 text-sm text-gray-900` |
| Hover row | `hover:bg-gray-50` (when `onRowClick` provided) |
| Expanded row | `bg-gray-50`, cell `px-0 py-0` |
| Pagination bar | `flex items-center justify-between px-6 py-3 border-t border-gray-200` |
| Page buttons | `px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50` |
| Active sort icon | `ChevronUp` or `ChevronDown` (h-3 w-3) |
| Inactive sort icon | `ChevronsUpDown` (h-3 w-3 text-gray-300) |

---

## 7. Usage Examples

### 7.1 Basic Usage

```tsx
<DataTable
  data={produits}
  columns={[
    { key: "nom", header: "Name", sortable: true },
    { key: "statut", header: "Status", render: (p) => <Badge>{p.statut}</Badge> },
  ]}
  onRowClick={(p) => router.push(`/produits/${p.id}`)}
/>
```

### 7.2 With Pagination

```tsx
<DataTable data={milestones} columns={columns} pageSize={10} />
```

### 7.3 With Sort Value and Tiebreaker

```tsx
{
  key: "datePrevue",
  header: "Date",
  sortable: true,
  sortValue: (m) => m.datePrevue ?? "",
  tiebreaker: (m) => m.nom,
}
```

### 7.4 With Expandable Rows

```tsx
<DataTable
  data={items}
  columns={columns}
  expandedContent={(item) =>
    item.details ? <div className="p-4">{item.details}</div> : null
  }
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| clsx | External | Conditional classname merging |
| lucide-react | External | Sort icons (ChevronUp, ChevronDown, ChevronsUpDown) |
| react-i18next | External | Translation of pagination text and empty message |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Sort indicator | `aria-sort="ascending"`, `"descending"`, or `"none"` on sortable headers |
| Focusable headers | `tabIndex={0}` on sortable headers |
| Keyboard sort | `onKeyDown` handler: Enter or Space triggers sort |
| Expanded rows | `aria-expanded` attribute on expandable rows |
| Previous/Next buttons | `aria-label="Previous page"` / `"Next page"` |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Full table with all columns |
| Tablet/Mobile | Horizontal scroll via `overflow-x-auto` container |

---

## 11. Exported Utilities

In addition to the default component export, the file exports:

| Export | Type | Purpose |
|--------|------|---------|
| `Column<T>` | Interface | Column definition type used by all pages to define their columns |
| `getAriaSort()` | Function | Returns aria-sort attribute value for a column header. Also used by MilestonesTab and PhasesTab. |
| `getSortIcon()` | Function | Returns the sort icon ReactNode for a column header. Also used by MilestonesTab and PhasesTab. |

---

## 12. Known Limitations

- No virtual scrolling for large datasets (all rows are rendered to the DOM).
- Sort is client-side only (all data must be loaded in memory).
- Row key uses `item.id` if available, falls back to array index.
- No multi-column sort support.

---

## 13. Pages Using This Component

| Page | Context |
|------|---------|
| Produits list | Main product table |
| Projets list (via ProjetTreeTable) | Indirect — ProjetTreeTable implements its own table but follows the same patterns |
| Ressources list | Main resource table |
| Project detail > Milestones tab | Milestone table |
| Project detail > Phases tab | Phase table |
| Project detail > Livrables tab | Deliverable table |
| Project detail > Risques tab | Risk table |
| Project detail > Charge tab | Workload table |
| Resource detail > Conges tab | Leave period table |
| Release detail page | Livrable table within release |
