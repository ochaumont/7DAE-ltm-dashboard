# UI Component Specification — SettingsModal

> Specification for the application settings modal accessible from the Navbar gear icon.

---

## 1. General Information

| Field | Value |
|-------|-------|
| Component Name | SettingsModal |
| File Path | src/components/ui/SettingsModal.tsx |
| Type | Domain-specific |
| Complexity | Complex (301 lines) |
| Status | Stable |

---

## 2. Purpose

SettingsModal provides an application-level settings panel with three sections: read-only application roles, dynamic user roles CRUD (via REST API), and UI filter configuration (persisted to localStorage). It is opened from the Navbar gear icon and serves as the central configuration point for the application.

---

## 3. Props Interface

### 3.1 Required Props

| Prop | Type | Description |
|------|------|-------------|
| open | `boolean` | Whether the modal is visible |
| onClose | `() => void` | Close handler |

### 3.2 Internal Types

```typescript
type FilterValue = "internal" | "external" | "both";

interface UiConfig {
  resourcesFilter: FilterValue;
  productsFilter: FilterValue;
}
```

---

## 4. Variants / Modes

| Variant | Description | Trigger |
|---------|-------------|---------|
| Loading | Shows "Loading..." text in user roles section | Roles being fetched from API |
| Empty roles | Shows italic "No user roles" message | API returns empty array |
| With roles | Shows role list with delete buttons | Roles fetched successfully |
| Delete confirmation | Opens ConfirmDeleteModal | Click delete button on a role |

---

## 5. Behavior

### 5.1 Section 1 — Application Roles (Read-only)

Static display of three hardcoded application roles as badges: Admin, Project Manager, Product Owner. No API calls.

### 5.2 Section 2 — User Roles (CRUD)

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Fetch roles | Modal opens | GET `/api/settings/user-roles` |
| Add role | Click "Add" button or press Enter | POST `/api/settings/user-roles` with `{ name }`, then refetch |
| Delete role | Click trash icon | Opens ConfirmDeleteModal |
| Confirm delete | Click Delete in confirmation modal | DELETE `/api/settings/user-roles/{id}`, then refetch |
| Cancel delete | Click Cancel in confirmation modal | Closes confirmation, no action |

Add button is disabled when:
- `adding` is true (request in progress)
- `addName.trim()` is empty

### 5.3 Section 3 — UI Configuration

| Interaction | Trigger | Behavior |
|-------------|---------|----------|
| Change filter | Click radio button | Immediately writes to localStorage key `atom_settings` |
| Load config | Modal opens / component mounts | Reads from localStorage with safe fallback to defaults |

Filter options for both Resources and Products: `internal`, `external`, `both` (default: `both`).

### 5.4 Internal State

| State | Type | Purpose |
|-------|------|---------|
| userRoles | `UserRole[]` | Fetched user roles from API |
| loadingRoles | `boolean` | Whether roles are being loaded |
| addName | `string` | New role name input value |
| adding | `boolean` | Whether an add request is in progress |
| deleteTarget | `UserRole \| null` | Role pending deletion (triggers ConfirmDeleteModal) |
| uiConfig | `UiConfig` | Current UI filter configuration |

### 5.5 Data Persistence

| Data | Storage | Key |
|------|---------|-----|
| User roles | REST API | `/api/settings/user-roles` |
| UI config | localStorage | `atom_settings` |

---

## 6. Visual Specification

### 6.1 Layout

```
┌─────────────────────────────────────────────────┐
│ Settings                                        │
│                                                 │
│ Section 1: Application Roles                    │
│  [Admin] [Project Manager] [Product Owner]      │  <- read-only badges
│ ─────────────────────────────────────────────── │
│ Section 2: User Roles                           │
│  . Developer          [trash]                   │  <- CRUD via API
│  . Designer           [trash]                   │
│  [New role name...] [+ Add]                     │
│ ─────────────────────────────────────────────── │
│ Section 3: UI Configuration                     │
│  Resources: (o) Internal ( ) External (o) Both  │  <- localStorage
│  Products:  ( ) Internal ( ) External (o) Both  │
└─────────────────────────────────────────────────┘
```

### 6.2 Styling

| Element | Classes / Tokens |
|---------|-----------------|
| Section headings | `text-sm font-semibold text-gray-800 mb-1` |
| Section descriptions | `text-xs text-gray-500 mb-3` |
| Role badges | `Badge` component with `color="gray"` |
| Role list items | `flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50` |
| Delete button | `text-gray-400 hover:text-red-500 transition-colors` |
| Add input | `flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm` |
| Radio buttons | `accent-indigo-600` |
| Section dividers | `<hr className="border-gray-200">` |

---

## 7. Usage Examples

### 7.1 In Navbar

```tsx
const [settingsOpen, setSettingsOpen] = useState(false);

<button onClick={() => setSettingsOpen(true)}>
  <Settings className="h-5 w-5" />
</button>

<SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
```

---

## 8. Dependencies

| Dependency | Type | Purpose |
|------------|------|---------|
| Modal | Internal | Headless UI Dialog wrapper |
| Button | Internal | Action buttons (Add, Cancel, Delete) |
| Badge | Internal | Application role display |
| ConfirmDeleteModal | Internal | Delete confirmation dialog |
| lucide-react | External | Trash2, Plus icons |
| react-i18next | External | Translation of all labels and messages |
| api.ts | Internal | `getUserRoles`, `createUserRole`, `deleteUserRole` functions |

---

## 9. Accessibility

| Aspect | Implementation |
|--------|---------------|
| Modal | Inherits from Modal component (Headless UI Dialog) |
| Delete buttons | `aria-label="Delete"` |
| Radio groups | Wrapped in `<fieldset>` with `<legend>` |
| Keyboard | Enter key in add input triggers `handleAddRole` |
| Focus management | Handled by Modal wrapper |

---

## 10. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| All | Modal width determined by Modal component; content flows vertically |

---

## 11. Known Limitations

- UI configuration changes are applied immediately (no draft/apply/cancel pattern for Section 3).
- Application roles are hardcoded; cannot be customized.
- No validation on user role name uniqueness (relies on backend).
- Error handling defers to global Axios interceptor (toast notifications).

---

## 12. Pages Using This Component

| Page | Context |
|------|---------|
| Navbar (global) | Gear icon opens this modal from any page |
