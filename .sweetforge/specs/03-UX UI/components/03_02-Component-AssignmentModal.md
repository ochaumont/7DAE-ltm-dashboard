# UI Component Specification — AssignmentModal

> Specification for the modal that assigns resources to livrables with percentage allocation.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | AssignmentModal |
| File Path | src/components/ui/AssignmentModal.tsx |
| Type | Domain-specific |
| Complexity | Complex (229 lines) |
| Status | Stable |

---

## 2. Purpose

AssignmentModal provides a bulk assignment interface for distributing work percentages across team members on a specific livrable. It enforces business rule RG-02 (total allocation must equal 100%) with a color-coded progress bar, supports adding/removing resources, and includes a "Split evenly" convenience action. State is managed by the parent via the `useAssignment` hook.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| open | `boolean` | Whether the modal is visible |
| onClose | `() => void` | Close handler (also used as Cancel) |
| targetLivrableName | `string` | Name of the livrable being assigned (shown in the modal title) |
| formList | `AssignmentEntry[]` | Current list of assignment entries (controlled by parent) |
| setFormList | `Dispatch<SetStateAction<AssignmentEntry[]>>` | State setter for the assignment entries list |
| total | `number` | Sum of all assignment percentages (computed by parent) |
| assignAddOpen | `boolean` | Whether the "add resource" combobox is currently expanded |
| setAssignAddOpen | `Dispatch<SetStateAction<boolean>>` | Toggles the add-resource combobox visibility |
| addResource | `(ressourceId: string) => void` | Adds a new resource to the assignment list with 0% |
| removeResource | `(idx: number) => void` | Removes a resource from the assignment list by index |
| splitEvenly | `() => void` | Redistributes percentages evenly across all assigned resources |
| onSubmit | `() => void` | Submits the assignment form (parent handles API call) |
| teamMembers | `Array<{ ressourceId: string }>` | Team members eligible for assignment |
| ressourceMap | `Record<string, Ressource>` | Lookup map of ressource ID to Ressource object for display names |
| translationNs | `string` | i18n namespace to use for translation keys (varies by calling page) |

### 3.2 Sub-Types

```typescript
// From useAssignment hook
interface AssignmentEntry {
  ressourceId: string;
  pourcentage: number;
}
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Empty (no team) | Shows "No team members" message | `availableMembers.length === 0 && formList.length === 0` |
| With assignments | Shows resource cards with percentage controls | `formList.length > 0` |
| Add resource mode | Shows Combobox for selecting a new resource | `assignAddOpen === true` |
| Total = 100% | Green progress bar, Save enabled | `total === 100` |
| Total < 100% | Amber progress bar, Save disabled, warning text | `total < 100` |
| Total > 100% | Red progress bar, Save disabled, warning text | `total > 100` |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Add resource | Click "+ Add resource", then select from Combobox | Adds entry with 0%, closes Combobox |
| Remove resource | Click trash icon on resource card | Removes entry from formList by index |
| Change percentage | Edit number input or drag slider | Updates `pourcentage` for that entry (clamped 0-100) |
| Split evenly | Click "Split evenly" link | Calls `splitEvenly()` which distributes 100% evenly |
| Save | Click Save button | Calls `onSubmit()` (disabled if total != 100% when entries exist) |
| Cancel | Click Cancel button | Calls `onClose()` |

### 5.2 Business Rule Enforcement

**RG-02 — Total allocation must equal 100%:**
- Save button is disabled when `formList.length > 0 && total !== 100`.
- Warning text "Total must be 100%" shown when `total !== 100`.
- Progress bar color coding: green (100%), amber (<100%), red (>100%).

### 5.3 Resource Filtering

Already-assigned resources are filtered out of the available members list (`assignedIds` Set), preventing duplicate assignments.

### 5.4 Internal Sub-Component

`ResourceAssignmentRow` renders a single resource card with:
- Resource name (from `ressourceMap` lookup)
- Number input (0-100) + range slider for percentage
- Delete button

---

## 6. Visual Specification

### 6.1 Layout

```
┌─────────────────────────────────────────────────┐
│  Assignments -- {livrable name}                 │
│                                                 │
│  ┌─ Resource card ───────────────────────────┐  │
│  │ Jean Dupont           [__50__] % [trash]  │  │
│  │ [================-------] (slider)        │  │
│  └───────────────────────────────────────────┘  │
│  ┌─ Resource card ───────────────────────────┐  │
│  │ Marie Martin          [__50__] % [trash]  │  │
│  │ [====================---] (slider)        │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  [+ Add resource]                               │
│                                                 │
│  Total:                    [Split evenly]       │
│  [==============================] 100%          │
│  (green=100, amber<100, red>100)                │
│                                                 │
│                     [Cancel]  [Save]            │
└─────────────────────────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Resource card | `rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 space-y-1.5` |
| Percentage input | `w-14 rounded border border-gray-300 px-1.5 py-0.5 text-sm text-right` |
| Range slider | `w-full h-2 accent-indigo-500 cursor-pointer` |
| Add resource link | `text-sm text-indigo-600 hover:text-indigo-800 font-medium` |
| Total bar (100%) | `bg-green-500 rounded-full` |
| Total bar (<100%) | `bg-amber-500 rounded-full` |
| Total bar (>100%) | `bg-red-500 rounded-full` |
| Total text | `text-xs font-bold text-white drop-shadow` centered in bar |
| Warning text | `text-xs text-red-500` |
| Split evenly link | `text-xs text-indigo-600 hover:text-indigo-800 underline` |

---

## 7. Usage Examples

### 7.1 In a Tab Component

```tsx
const assignment = useAssignment({ ... });

<AssignmentModal
  open={assignModalOpen}
  onClose={() => setAssignModalOpen(false)}
  targetLivrableName={selectedLivrable?.nom ?? ""}
  formList={assignment.formList}
  setFormList={assignment.setFormList}
  total={assignment.total}
  assignAddOpen={assignment.assignAddOpen}
  setAssignAddOpen={assignment.setAssignAddOpen}
  addResource={assignment.addResource}
  removeResource={assignment.removeResource}
  splitEvenly={assignment.splitEvenly}
  onSubmit={handleSaveAssignments}
  teamMembers={teamMembers}
  ressourceMap={ressourceMap}
  translationNs="releases"
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| Modal | Internal | Headless UI Dialog wrapper |
| Button | Internal | Primary/secondary action buttons |
| Combobox | Internal | Resource selection dropdown |
| lucide-react | External | Plus, Trash2 icons |
| react-i18next | External | Translation of labels and messages |
| useAssignment (hook) | Internal | Provides AssignmentEntry type |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Modal | Inherits from Modal component (Headless UI Dialog) |
| Delete buttons | `aria-label="Delete"` |
| Focus management | Handled by Modal wrapper |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| All | Modal width determined by Modal component; resource cards stack vertically |

---

## 11. Known Limitations

- Percentage inputs clamped to 0-100 per resource; no validation that individual values are reasonable.
- "Split evenly" distributes 100% regardless of current values (overwrites all).
- No undo/redo for percentage changes within the modal.
- Save is allowed with 0 entries (empty assignment list), which effectively removes all assignments.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Produit detail > Releases tab | Assign resources to release livrables |
| Release detail page | Assign resources to livrables |
| Project detail > Livrables tab | Assign resources to project livrables |
