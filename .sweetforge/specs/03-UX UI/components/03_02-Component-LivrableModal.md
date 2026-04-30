# UI Component Specification — LivrableModal

> Specification for the shared create/edit modal for livrables (deliverables).

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | LivrableModal |
| File Path | src/components/ui/LivrableModal.tsx |
| Type | Domain-specific |
| Complexity | Complex (334 lines) |
| Status | Stable |

---

## 2. Purpose

LivrableModal is a shared create/edit form modal for livrables (deliverables). It handles two livrable types (ACTIVITY and EVENT) with conditional field display, Zod-based form validation, and controlled form state lifted to the parent. The modal exports `defaultLivrableForm` and the `LivrableForm` type for parent components to initialize and manage form state.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| open | `boolean` | Whether the modal is visible |
| onClose | `() => void` | Close handler (also used as Cancel) |
| editLivrable | `Livrable \| null` | The livrable being edited, or null for creation mode |
| form | `LivrableForm` | Current form state (controlled by parent) |
| onFormChange | `(form: LivrableForm) => void` | Callback to update form state in the parent |
| onSubmit | `() => void` | Submit handler — parent performs the API call |

### 3.2 Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isSaving | `boolean` | `undefined` | When true, the submit button shows a loading state and is disabled |

### 3.3 Exported Types

```typescript
export const defaultLivrableForm = {
  nom: "",
  description: "",
  estimationCharge: 0,
  progress: 0,
  statut: "A_FAIRE" as StatutLivrable,
  priorite: "MOYENNE" as Priorite,
  typeLivrable: "ACTIVITY" as TypeLivrable,
  dateDebut: "",
  dateLivraison: "",
};

export type LivrableForm = typeof defaultLivrableForm;
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Create mode | Title "Create Livrable", Submit button shows "Create" | `editLivrable === null` |
| Edit mode | Title "Edit Livrable", Submit button shows "Save" | `editLivrable` is set |
| ACTIVITY type | Shows start date + delivery date (two date inputs) | `form.typeLivrable === "ACTIVITY"` |
| EVENT type | Shows single event date input | `form.typeLivrable === "EVENT"` |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Toggle type | Click ACTIVITY/EVENT button | Switches type; clears date fields to prevent stale data |
| Edit form fields | Input changes | Calls `onFormChange` with updated form |
| Submit | Click Create/Save button | Validates form via Zod schema; calls `onSubmit` if valid |
| Cancel | Click Cancel button or close modal | Calls `onClose` |
| Set event date | Change date input in EVENT mode | Sets both `dateDebut` and `dateLivraison` to the same value |

### 5.2 Internal State

This component has no persistent internal state. It uses the `useFormValidation` hook for validation errors which are cleared on modal open.

### 5.3 Type Switching Logic

| Transition | Date field behavior |
|------------|-------------------|
| ACTIVITY -> EVENT | Both `dateDebut` and `dateLivraison` cleared |
| EVENT -> ACTIVITY | Only `dateLivraison` cleared (dateDebut preserved) |

### 5.4 Form Fields

| Field | Input Type | Range/Options | Applies To |
|-------|-----------|---------------|------------|
| Type | Toggle buttons | ACTIVITY / EVENT | Both |
| Name (nom) | Text input | Free text | Both |
| Description | Textarea (2 rows) | Free text | Both |
| Estimated effort | Range slider + number input | 0-25 man-days | Both |
| Progress | Range slider + number input | 0-100% | Both |
| Event date | Date input | Date picker | EVENT only |
| Start date (dateDebut) | Date input | Date picker | ACTIVITY only |
| Delivery date (dateLivraison) | Date input | Date picker | ACTIVITY only |
| Status (statut) | Select dropdown | A_FAIRE, EN_COURS, TERMINE, ANNULE | Both |
| Priority (priorite) | Select dropdown | HAUTE, MOYENNE, BASSE | Both |

### 5.5 Validation

Uses `livrableFormSchema` from `lib/schemas` via the `useFormValidation` hook. Validation errors are:
- Cleared when the modal opens (via `useEffect` on `open`).
- Checked on submit via `validate(form)`. If invalid, submit is blocked.
- Displayed inline below the `nom` field via `fieldError("nom")`.

---

## 6. Visual Specification

### 6.1 Layout

```
┌─────────────────────────────────────┐
│  Create Livrable / Edit Livrable    │
│                                     │
│  Type:  [ACTIVITY] [EVENT]          │
│                                     │
│  Name:  [___________________]       │
│  Description: [______________]      │
│                                     │
│  Estimated effort:                  │
│  [========----] [__5__] man-days    │
│                                     │
│  Progress:                          │
│  [==============----] [__70__] %    │
│                                     │
│  Start date:     Delivery date:     │  <- ACTIVITY
│  [__________]    [__________]       │
│    -- OR --                         │
│  Event date: [__________]           │  <- EVENT
│                                     │
│  Status: [A_FAIRE v]               │
│  Priority: [MOYENNE v]             │
│                                     │
│              [Cancel]  [Create]     │
└─────────────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Form container | `space-y-4` |
| Labels | `block text-sm font-medium text-gray-700 mb-1` |
| Text inputs | `w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500` |
| Type button (active) | `bg-indigo-600 text-white border-indigo-600` |
| Type button (inactive) | `bg-white text-gray-700 border-gray-300 hover:bg-gray-50` |
| Range slider | `flex-1 h-2 accent-indigo-600` |
| Number input | `w-20 rounded-md border border-gray-300 px-3 py-2 text-sm text-center` |
| Date grid | `grid grid-cols-2 gap-4` (ACTIVITY mode) |
| Validation error | `text-sm text-red-500 mt-1` |

---

## 7. Usage Examples

### 7.1 In a Parent Component

```tsx
const [form, setForm] = useState(defaultLivrableForm);
const [editItem, setEditItem] = useState<Livrable | null>(null);

<LivrableModal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  editLivrable={editItem}
  form={form}
  onFormChange={setForm}
  onSubmit={handleSubmit}
  isSaving={saving}
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| Modal | Internal | Headless UI Dialog wrapper |
| Button | Internal | Primary/secondary action buttons |
| react-i18next | External | Translation of labels, enum values, buttons |
| useFormValidation | Internal | Zod-based form validation hook |
| livrableFormSchema | Internal | Zod validation schema from lib/schemas |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Modal | Inherits from Modal component (Headless UI Dialog) |
| Labels | All form fields have associated `<label>` elements |
| Error messages | Inline validation errors below fields |
| Focus management | Handled by Modal wrapper |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Desktop | Two-column grid for status/priority and date fields |
| Mobile | Grid collapses naturally within modal width |

---

## 11. Known Limitations

- Effort estimation capped at 25 man-days.
- Progress capped at 100%.
- Only the `nom` field shows inline validation errors; other fields rely on the Zod schema but may not display errors visually.
- Form state is fully controlled by the parent; the modal does not manage its own form state.

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Produit detail > Releases tab | Create/edit livrables within a release |
| Release detail page | Create/edit livrables |
| Project detail > Livrables tab | Create/edit livrables linked to a project |
| Project detail > Phases tab | Create/edit owned livrables within a phase |
