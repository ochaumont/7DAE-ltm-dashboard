# UI Component Specification — ConfirmDeleteModal

> Specification for the reusable delete confirmation dialog with optional name confirmation.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | ConfirmDeleteModal |
| File Path | src/components/ui/ConfirmDeleteModal.tsx |
| Type | Generic |
| Complexity | Moderate (167 lines) |
| Status | Stable |

---

## 2. Purpose

ConfirmDeleteModal is a safety dialog shown before any destructive deletion. It displays a warning with the entity name, optionally requires the user to type the exact entity name to confirm, and can show cascade warnings about dependent entities that will also be deleted. Used across all pages with delete functionality.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| open | `boolean` | Whether the modal is visible |
| onClose | `() => void` | Close/cancel handler |
| onConfirm | `() => void` | Confirm deletion handler (called only when canDelete is true) |
| title | `string` | Modal title (e.g., "Delete Product") |
| entityName | `string` | Name of the entity being deleted (shown in bold in the confirmation text) |

### 3.2 Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| cascadeWarnings | `CascadeWarning[]` | `undefined` | List of dependent entities that will be cascade-deleted |
| requireNameConfirmation | `boolean` | `false` | When true, user must type the exact entity name to enable the Delete button |
| loading | `boolean` | `false` | When true, the Delete button shows a loading state ("Deleting...") and is disabled |

### 3.3 Sub-Types

```typescript
interface CascadeWarning {
  message: string;
  count?: number;
}
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Simple confirmation | Warning message + Delete/Cancel buttons | `requireNameConfirmation=false` |
| Name confirmation | Adds text input; Delete disabled until exact name match | `requireNameConfirmation=true` |
| With cascade warnings | Amber warning box listing dependent entities | `cascadeWarnings` array provided |
| Loading | Delete button shows "Deleting..." and is disabled | `loading=true` |

---

## 5. Behavior

### 5.1 Interactions

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Confirm | Click Delete button | Calls `onConfirm()`, clears confirmation text |
| Cancel | Click Cancel button or close modal | Calls `onClose()`, clears confirmation text |
| Type confirmation | Type in name input | Enables Delete when typed text exactly matches `entityName` |

### 5.2 Internal State

| State | Type | Purpose |
|-------|------|---------|
| confirmText | `string` | Text typed in the name confirmation input |

### 5.3 Auto-focus

When `requireNameConfirmation` is true, the confirmation input is auto-focused using a callback ref with a 100ms delay. The delay allows the Headless UI Dialog transition to complete before focusing.

### 5.4 Delete Enable Logic

```
canDelete = requireNameConfirmation ? (confirmText === entityName) : true
Delete button disabled = !canDelete || loading
```

---

## 6. Visual Specification

### 6.1 Layout

```
┌───────────────────────────────────────┐
│  Delete Product                       │
│                                       │
│  [!] Are you sure you want to delete  │
│      "Entity Name"?                   │
│      This action cannot be undone.    │
│                                       │
│  ┌─ Cascade warnings (amber) ──────┐ │  <- optional
│  │ This will also delete:           │ │
│  │ . 3 releases                     │ │
│  │ . 12 livrables                   │ │
│  └──────────────────────────────────┘ │
│                                       │
│  Type "Entity Name" to confirm:       │  <- optional
│  [____________________________]       │
│                                       │
│                [Cancel]  [Delete]      │
└───────────────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Warning icon container | `w-10 h-10 rounded-full bg-red-100 flex items-center justify-center` |
| Warning icon | `AlertTriangle h-5 w-5 text-red-600` |
| Entity name in text | `<span className="font-semibold">` (via `<Trans>` component) |
| "Cannot be undone" text | `text-sm text-gray-500 mt-1` |
| Cascade warning box | `bg-amber-50 border border-amber-200 rounded-lg p-3` |
| Cascade warning title | `text-sm font-medium text-amber-800 mb-1` |
| Cascade warning items | `text-sm text-amber-700 list-disc ml-4 space-y-0.5` |
| Confirmation input | `w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500` |
| Confirmation prompt | Font-mono bold entity name in gray-100 background pill |
| Delete button | Button `variant="danger"` |
| Cancel button | Button `variant="secondary"` |

---

## 7. Usage Examples

### 7.1 Simple Confirmation

```tsx
<ConfirmDeleteModal
  open={deleteOpen}
  onClose={() => setDeleteOpen(false)}
  onConfirm={handleDelete}
  title="Delete Release"
  entityName={release.nom}
/>
```

### 7.2 With Name Confirmation and Cascade Warnings

```tsx
<ConfirmDeleteModal
  open={deleteOpen}
  onClose={() => setDeleteOpen(false)}
  onConfirm={handleDelete}
  title="Delete Product"
  entityName={product.nom}
  requireNameConfirmation={true}
  cascadeWarnings={[
    { message: "releases", count: 3 },
    { message: "livrables", count: 12 },
  ]}
  loading={deleting}
/>
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| Modal | Internal | Headless UI Dialog wrapper |
| Button | Internal | Primary/secondary/danger action buttons |
| lucide-react | External | AlertTriangle warning icon |
| react-i18next | External | Translation via `useTranslation` and `<Trans>` component |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Modal | Inherits from Modal component (Headless UI Dialog) |
| Focus | Auto-focuses confirmation input on open (100ms delay for transition) |
| Semantic | `<Trans>` component used for structured translation with bold entity name |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| All | Modal width determined by Modal component; content stacks vertically |

---

## 11. Known Limitations

- Name confirmation is case-sensitive exact match only.
- No keyboard shortcut to confirm (must click Delete button or Tab to it).
- Auto-focus delay is hardcoded to 100ms.
- Confirmation text is not cleared if the modal is closed by external means (e.g., parent sets `open=false` directly).

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Produits list/detail | Delete product, release |
| Projets list/detail | Delete project, milestone, phase, work package |
| Ressources list/detail | Delete resource, leave period |
| Release detail | Delete livrable |
| SettingsModal | Delete user role |
