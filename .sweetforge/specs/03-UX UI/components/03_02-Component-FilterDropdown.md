# UI Component Specification — FilterDropdown

> Specification for the inline dropdown filter component used for filtering tables by enum values.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | FilterDropdown |
| File Path | src/components/ui/FilterDropdown.tsx |
| Type | Generic |
| Complexity | Moderate (150 lines) |
| Status | Stable |

---

## 2. Purpose

FilterDropdown is a compact, pill-style dropdown for filtering tables by categorical values (e.g., status, type). It provides visual feedback when a filter is active (indigo highlight), supports keyboard navigation following the WCAG listbox pattern, and includes optional color dot indicators per option.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| value | `string` | Currently selected filter value (empty string = no filter active) |
| onChange | `(value: string) => void` | Callback when an option is selected |
| options | `FilterOption[]` | List of available filter options |

### 3.2 Exported Types

```typescript
export interface FilterOption {
  /** The filter value passed to onChange when selected */
  value: string;
  /** Display label shown in the trigger button and dropdown */
  label: string;
  /** Optional Tailwind bg class for a colored dot indicator (e.g., "bg-green-500") */
  dot?: string;
}
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Inactive | Gray border, neutral styling | `value === ""` |
| Active | Indigo border + indigo-50 background | `value !== ""` |
| Open | Dropdown visible below trigger | Click trigger or Enter/Space |
| Closed | Only trigger button visible | Default, click-outside, Escape, or selection |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Open dropdown | Click trigger button | Toggles dropdown visibility, sets focusIdx to current selection |
| Select option | Click option | Calls `onChange(value)`, closes dropdown |
| Close | Click outside or press Escape | Closes dropdown without changing value |

### 5.2 Internal State

| State | Type | Purpose |
|-------|------|---------|
| open | `boolean` | Whether the dropdown is visible |
| focusIdx | `number` | Index of keyboard-focused option (-1 = none) |

### 5.3 Keyboard Support

| Key | Action |
|-----|--------|
| Enter / Space | Open dropdown (if closed) or select focused option (if open) |
| ArrowDown | Move focus to next option (wraps around to first) |
| ArrowUp | Move focus to previous option (wraps around to last) |
| Escape | Close dropdown without changing selection |

### 5.4 Click-Outside

Uses a `mousedown` event listener on `document` to close the dropdown when clicking outside the component container. Listener is only attached when dropdown is open.

---

## 6. Visual Specification

### 6.1 Layout

```
[. Status v]           <- trigger button (pill style)
┌──────────────────┐
│ . All         [x] │  <- selected option has checkmark
│ . In Progress     │
│ . Completed       │
│ . Cancelled       │
└──────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Trigger (inactive) | `border-gray-300 bg-white text-gray-600 hover:bg-gray-50` |
| Trigger (active) | `border-indigo-500 bg-indigo-50 text-indigo-700` |
| Trigger shape | `inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium` |
| Chevron icon | `ChevronDown h-3 w-3`, rotates 180deg when open |
| Color dot | `inline-block h-2 w-2 rounded-full` + Tailwind bg class from `dot` prop |
| Dropdown panel | `absolute left-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border border-gray-200 bg-white shadow-lg py-1` |
| Option (default) | `text-gray-700 hover:bg-gray-50` |
| Option (selected) | `bg-indigo-50 text-indigo-700 font-medium` |
| Option (focused) | `bg-gray-50 text-gray-700` |
| Checkmark | `Check h-3.5 w-3.5 text-indigo-600` on selected option |

---

## 7. Usage Examples

### 7.1 Status Filter

```tsx
const statusOptions: FilterOption[] = [
  { value: "", label: "All statuses" },
  { value: "EN_COURS", label: "In Progress", dot: "bg-yellow-500" },
  { value: "TERMINE", label: "Completed", dot: "bg-green-500" },
  { value: "ANNULE", label: "Cancelled", dot: "bg-gray-500" },
];

<FilterDropdown
  value={statusFilter}
  onChange={setStatusFilter}
  options={statusOptions}
/>
```

### 7.2 As Extra Control in TableToolbar

```tsx
<TableToolbar
  {...toolbarProps}
  extraControls={
    <FilterDropdown value={filter} onChange={setFilter} options={options} />
  }
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| lucide-react | External | ChevronDown, Check icons |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Trigger | `aria-label` set to selected option's label or "Filter" |
| Focus | `focus:outline-none focus:ring-2 focus:ring-indigo-500` on trigger |
| Keyboard | Full WCAG listbox pattern: ArrowUp/Down, Enter/Space, Escape |
| Visual indicator | Checkmark on selected option, indigo highlight on active state |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| All | Compact pill button; dropdown has `min-w-[160px]` and positions absolutely below trigger |

---

## 11. Known Limitations

- No multi-select support (single value only).
- Dropdown always opens downward (no flip detection for bottom of viewport).
- `focusIdx` is visual only; options are not actual ARIA listbox options (no `role="option"`).
- No typeahead search within the dropdown.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Dashboard projets | Status filter for project list |
| Releases tab / Release detail | Status and assignment filters |
| Various detail tabs | Passed as `extraControls` to TableToolbar |
