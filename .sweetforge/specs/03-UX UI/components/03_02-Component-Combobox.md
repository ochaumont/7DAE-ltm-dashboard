# UI Component Specification — Combobox

> Specification for the generic searchable dropdown selector used for resource and entity selection.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | Combobox\<T\> |
| File Path | src/components/ui/Combobox.tsx |
| Type | Generic |
| Complexity | Complex (209 lines) |
| Status | Stable |

---

## 2. Purpose

Combobox is a generic searchable dropdown component for selecting items from potentially large lists. It provides type-ahead filtering, click-outside-to-close behavior, and highlights the currently selected item. Used wherever a user needs to pick from a list of resources, project managers, or team members.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| items | `T[]` | Full list of selectable items (unfiltered) |
| value | `string` | Currently selected item's ID (empty string = nothing selected) |
| onSelect | `(item: T) => void` | Callback when an item is picked from the dropdown |
| getItemId | `(item: T) => string` | Extracts a unique string ID from an item |
| getItemLabel | `(item: T) => string` | Extracts a human-readable label from an item |

### 3.2 Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| filterFn | `(item: T, query: string) => boolean` | Case-insensitive label match | Custom filter predicate |
| placeholder | `string` | `""` | Input placeholder when nothing is selected |
| noResultsText | `string` | `"No results"` | Text shown when filter yields no matches |
| maxItems | `number` | `50` | Maximum items rendered in the dropdown to prevent DOM bloat |
| selectedLabel | `string` | `undefined` | Display label for the currently selected value (synced when dropdown closes) |
| onClear | `() => void` | `undefined` | Callback when the clear button is clicked |
| disabled | `boolean` | `false` | Disables the input and hides the clear button |
| error | `boolean` | `false` | Shows a red border to indicate a validation error |
| onBlur | `() => void` | `undefined` | Called when the combobox loses focus (click-outside) |

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Closed (with value) | Shows selected label as input text | Value set, dropdown closed |
| Closed (empty) | Shows placeholder text | No value, dropdown closed |
| Open (filtering) | Dropdown visible with filtered items | User focused or typed in input |
| Open (no results) | Shows "No results" message | Filter returns empty array |
| Disabled | Input grayed out, no interactions | `disabled={true}` |
| Error | Red border on input | `error={true}` |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Open dropdown | Focus input | Clears input text, opens dropdown showing all items |
| Filter | Type in input | Filters items by query using `filterFn` or default case-insensitive match |
| Select item | Click item in dropdown | Calls `onSelect(item)`, sets input text to item label, closes dropdown |
| Clear | Click "x" button | Clears input text, calls `onClear()` |
| Close | Click outside component | Closes dropdown, restores selected label or clears input, calls `onBlur()` |

### 5.2 Internal State

| State | Type | Purpose |
|-------|------|---------|
| query | `string` | Current search text in the input |
| open | `boolean` | Whether the dropdown is visible |

### 5.3 State Machine

```
  CLOSED (shows label)  --focus/type-->  OPEN (shows list)  --select item-->  CLOSED (shows label)
       ^                                      |                                      |
       |__ click outside / blur ______________|                                      |
       |__ clear (x) _______________________________________________________________|
```

### 5.4 Keyboard Support

| Key | Action |
|-----|--------|
| Enter / Space | Select focused item in dropdown |
| Tab | Move focus (standard browser behavior) |

### 5.5 Dependency Contract

The component intentionally omits some props from useEffect/useMemo dependency arrays. Parents should ensure that `onBlur`, `filterFn`, and `selectedLabel` are stable across renders (defined outside the render function or wrapped in `useCallback`/`useMemo`).

---

## 6. Visual Specification

### 6.1 Layout

```
┌─────────────────────────────────┐
│ [Search text...]           [x]  │  <- input + clear button
├─────────────────────────────────┤
│  Item 1                         │  <- dropdown list (absolute, z-50)
│  Item 2  (highlighted)          │  <- selected item has bg-indigo-50
│  Item 3                         │
│  ...                            │
└─────────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Container | `relative` |
| Input | `w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500` |
| Input (error) | `border-red-500` |
| Clear button | `absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600` |
| Dropdown | `absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg` |
| Dropdown item | `cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50` |
| Selected item | `bg-indigo-50 font-medium` |
| No results | `px-3 py-2 text-sm text-gray-500` |

---

## 7. Usage Examples

### 7.1 Resource Selection

```tsx
<Combobox
  items={ressources}
  value={selectedId}
  onSelect={(r) => setSelectedId(r.id)}
  getItemId={(r) => r.id}
  getItemLabel={(r) => `${r.prenom} ${r.nom}`}
  placeholder="Select a resource..."
  selectedLabel={selectedName}
  onClear={() => setSelectedId("")}
/>
```

### 7.2 With Custom Filter

```tsx
<Combobox
  items={members}
  value={value}
  onSelect={handleSelect}
  getItemId={(m) => m.ressourceId}
  getItemLabel={(m) => getDisplayName(m)}
  filterFn={(m, q) => getDisplayName(m).toLowerCase().includes(q.toLowerCase())}
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| react (useId) | Internal | Generates unique listbox ID for ARIA |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Role | `role="combobox"` on input |
| Expanded state | `aria-expanded={open}` on input |
| Controls | `aria-controls={listboxId}` linking input to dropdown |
| Autocomplete | `aria-autocomplete="list"` |
| Listbox | `role="listbox"` on dropdown `<ul>` |
| Options | `role="option"` + `aria-selected` on each `<li>` |
| Clear button | `aria-label="Clear"` |
| Keyboard | `tabIndex={0}` on options, Enter/Space to select |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| All | Input takes full width of parent (`w-full`), dropdown matches input width |

---

## 11. Known Limitations

- No keyboard arrow navigation within the dropdown (only Tab + Enter/Space on focused items).
- Maximum `maxItems` (default 50) items rendered in dropdown; remainder truncated without indication.
- Click-outside detection uses `mousedown` event, which may conflict with drag-and-drop in rare cases.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Project form | Chef de projet (CP) selection |
| Team member management (projet + produit) | Resource selection when adding team members |
| AssignmentModal | Resource selection when adding assignments |
