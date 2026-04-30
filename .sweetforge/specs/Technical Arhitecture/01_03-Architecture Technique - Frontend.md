# Frontend Technical Architecture

> Technical architecture reference for the frontend: stack, patterns, components, state management, and conventions.

---

## 1. Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.3 |
| Language | TypeScript | 5 |
| Runtime | React | 19.2.3 |
| Styling | Tailwind CSS | 4 |
| HTTP Client | Axios | 1.13.6 |
| Form Validation | Zod | 4.3.6 |
| i18n | react-i18next + i18next + i18next-browser-languagedetector | 16.5.8 / 25.8.18 / 8.2.1 |
| Icons | lucide-react | 0.577.0 |
| Modals / Dialogs | @headlessui/react | 2.2.9 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable + @dnd-kit/utilities | 6.3.1 / 10.0.0 / 3.2.2 |
| Toast / Notifications | sonner | 2.0.7 |
| Export | xlsx | 0.18.5 |
| CSS Utilities | clsx | 2.1.1 |
| Date Utilities | date-fns | 4.1.0 |
| Image Export | html-to-image | 1.11.13 |

**Internal packages (file: references):**

| Package | Purpose |
|---------|---------|
| sweet-gantt | Gantt chart components (ProductGantt, ProjectGantt) |
| sweet-release-grid | Release→Livrable hierarchical grid with DnD |
| sweet-types | Shared TypeScript types & constants |

---

## 2. Architecture

### 2.1 Rendering Strategy

- **Strategy**: Fully client-side (`"use client"` on all interactive pages)
- **Rationale**: Pervasive interactivity (modals, forms, drag-and-drop, Gantt charts) makes SSR impractical. Only the root layout is a server component (for metadata, fonts, providers).

### 2.2 Folder Structure

```
src/
├── app/                        # Pages (file-based routing)
│   ├── page.tsx                # Root redirect → /dashboard
│   ├── layout.tsx              # Root layout (I18nProvider, AuthProvider, Toaster)
│   ├── globals.css             # Airbus brand color overrides
│   ├── login/
│   │   └── page.tsx            # Login form
│   ├── dashboard/
│   │   ├── page.tsx            # Role-based redirect
│   │   ├── projets/page.tsx    # Manager dashboard: projects
│   │   ├── ressources/page.tsx # Manager dashboard: resources
│   │   └── alertes/page.tsx    # Manager dashboard: alerts
│   ├── produits/
│   │   ├── page.tsx            # Product list (DataTable + CRUD)
│   │   └── [id]/
│   │       ├── page.tsx        # Product detail (5 tabs)
│   │       ├── tabs/           # OverviewTab, ReleasesTab, RoadmapTab, RisksTab, TeamTab
│   │       └── releases/[releaseId]/
│   │           └── page.tsx    # Release detail (livrables + assignments)
│   ├── projets/
│   │   ├── page.tsx            # Project list (TreeTable + CRUD)
│   │   └── [id]/
│   │       ├── page.tsx        # Project detail (9 tabs, 727 lines)
│   │       └── tabs/           # SyntheseTab, MilestonesTab, PhasesTab, LivrablesTab,
│   │                           # WorkpackagesTab, GanttTab, ChargeTab, RisquesTab, TeamTab
│   │                           # + AssociatedLivrablesSection, OwnedLivrablesSection
│   └── ressources/
│       ├── page.tsx            # Resource list (DataTable + CRUD + import)
│       └── [id]/
│           ├── page.tsx        # Resource detail (4 tabs)
│           └── tabs/           # ProfileTab, CongesTab, ChargeTab, CapaciteTab
├── components/
│   ├── layout/                 # Navbar (314 lines), MainLayout, Breadcrumb
│   └── ui/                     # 18 reusable UI components
│       ├── DataTable.tsx       # Generic sortable/paginated table (310 lines)
│       ├── TableToolbar.tsx    # Search + export + settings popup (354 lines)
│       ├── ProjetTreeTable.tsx # Hierarchical project/WP table (350 lines)
│       ├── LivrableModal.tsx   # Shared livrable create/edit form (334 lines)
│       ├── SettingsModal.tsx   # App settings (roles, UI config) (301 lines)
│       ├── Combobox.tsx        # Generic searchable dropdown (209 lines)
│       ├── WpHierarchySvg.tsx  # SVG work-package hierarchy (248 lines)
│       ├── Modal.tsx           # Headless UI Dialog wrapper (98 lines)
│       ├── ConfirmDeleteModal.tsx # Delete confirmation dialog (167 lines)
│       ├── AssignmentModal.tsx # Resource assignment modal
│       ├── DiagramExporter.tsx # SVG/PNG/JPG diagram export (121 lines)
│       ├── FilterDropdown.tsx  # Dropdown filter component (150 lines)
│       ├── PageSkeleton.tsx    # Loading skeleton (110 lines)
│       ├── Badge.tsx           # Color-coded status badge (55 lines)
│       ├── Button.tsx          # Primary/secondary/danger/ghost (68 lines)
│       ├── Card.tsx            # Card container (50 lines)
│       ├── KpiCard.tsx         # KPI summary card (54 lines)
│       └── Tabs.tsx            # Tab navigation (84 lines)
├── hooks/                      # 9 custom hooks
│   ├── useTableSettings.ts    # Column visibility, order, pagination (162 lines)
│   ├── useTeamCRUD.ts         # Team member CRUD operations (166 lines)
│   ├── useAssignment.ts       # Resource assignment logic (135 lines)
│   ├── useCrudModal.ts        # Modal state + form management (105 lines)
│   ├── useDeleteConfirm.ts    # Delete confirmation flow (73 lines)
│   ├── useFormValidation.ts   # Zod schema validation (67 lines)
│   ├── useSettingsPopup.ts    # Draft/apply/cancel popup state (49 lines)
│   ├── useTabFromUrl.ts       # Tab state synced to URL ?tab= (41 lines)
│   └── useWideMode.ts         # Wide/narrow layout toggle (33 lines)
├── lib/                        # Utilities and services
│   ├── api.ts                  # Axios instance + 60+ typed CRUD functions (394 lines)
│   ├── auth.tsx                # AuthContext (React Context + localStorage) (89 lines)
│   ├── constants.ts            # Color maps, scoring, milestone types (209 lines)
│   ├── i18n.tsx                # i18next initialization + I18nProvider (139 lines)
│   ├── capacity.ts             # RG-03 working-day capacity formula (95 lines)
│   ├── alerts.ts               # RG-05 planning incompatibility detection (106 lines)
│   └── exportExcel.ts          # Excel export utility (42 lines)
├── types/
│   └── index.ts                # All TypeScript interfaces and union types (490 lines)
└── i18n/
    └── locales/                # Translation files (734 keys per language)
        ├── en/                 # 10 namespace JSON files
        ├── fr/                 # 10 namespace JSON files
        └── de/                 # 10 namespace JSON files
```

### 2.3 Routing

- **Router**: Next.js App Router (file-based)
- **Dynamic routes**: `[id]` segments for detail pages, `[releaseId]` for nested release detail
- **Role-based redirects**: Root page (`/`) redirects to `/dashboard`. Dashboard page (`/dashboard`) redirects by user role:
  - PRODUCT_OWNER → `/produits`
  - CHEF_DE_PROJET → `/projets`
  - MANAGER → `/dashboard/projets`
- **Protected routes**: Auth guard via `useAuth()` context — pages check `isAuthenticated` and redirect to `/login` if not authenticated

**Route map:**

| Route | Type | Page |
|-------|------|------|
| `/` | Redirect | → `/dashboard` |
| `/login` | Form | Login (email + password) |
| `/dashboard` | Redirect | Role-based redirect |
| `/dashboard/projets` | Dashboard | Manager project overview (KPIs + table) |
| `/dashboard/ressources` | Dashboard | Manager resource capacity overview |
| `/dashboard/alertes` | Dashboard | Planning incompatibility + overload alerts |
| `/produits` | List | Product list (DataTable + CRUD + import) |
| `/produits/[id]` | Detail | Product detail (5 tabs) |
| `/produits/[id]/releases/[releaseId]` | Detail | Release detail (livrables + assignments) |
| `/projets` | List | Project/WP tree table (CRUD + hierarchy) |
| `/projets/[id]` | Detail | Project detail (9 tabs) |
| `/ressources` | List | Resource list (DataTable + CRUD + import) |
| `/ressources/[id]` | Detail | Resource detail (4 tabs) |

---

## 3. State Management

### 3.1 Strategy

- **Global state**: React Context (`AuthContext` for user + preferences). No external store (no Redux, Zustand, etc.)
- **Local state**: `useState` + `useEffect` per page/component
- **Server state**: `useEffect` + fetch on mount, no React Query / SWR

### 3.2 Data Fetching Pattern

```
1. useEffect on mount triggers fetchAll()
2. Promise.allSettled for parallel fetches (primary entity must succeed, secondary can fail gracefully)
3. Loading state wraps the entire UI (page skeleton)
4. initialLoadDone ref skips setLoading(true) on refetches → prevents child unmount
5. After any mutation: call fetchAll() again → silent refresh (no spinner)
```

### 3.3 Local Persistence (localStorage / sessionStorage)

| Key | Content | Scope |
|-----|---------|-------|
| `atom_user` | Logged-in user (JSON) | Session |
| `atom_user_preferences` | User preferences (language, date format) | Session |
| `atom_locale` | Selected language (en/fr/de) | Preference |
| `atom_settings` | UI filter config (JSON) | Preference |
| `atom_table_{storageKey}` | Table settings (columns, sort, rows/page) | Per table |

**Known storageKeys:** `produits`, `ressources`, `projets`, `releases`, `projet-milestones`, `projet-phases`

---

## 4. API Client

### 4.1 Configuration

- **Library**: Axios
- **Base URL**: `http://localhost:8080/api` (configurable via `NEXT_PUBLIC_API_BASE_URL` env var)
- **Interceptors**: Global response interceptor shows toast (`sonner`) on 4xx/5xx/network errors, then re-throws via `Promise.reject`
- **Auth headers**: None (simulated auth — login is demo-mode only)

### 4.2 Function Pattern

```typescript
// One typed function per endpoint — 60+ exported functions
export const getProduits = () => api.get<Produit[]>("/produits");
export const createProduit = (data: Partial<Produit>) => api.post<Produit>("/produits", data);
export const updateProduit = (id: string, data: Partial<Produit>) => api.put<Produit>(`/produits/${id}`, data);
export const deleteProduit = (id: string) => api.delete(`/produits/${id}`);
```

### 4.3 Error Handling

- **Global**: Axios response interceptor → dynamic `sonner` import → toast notification with translated message (400 validation, 404 not found, 409 conflict, 5xx server, network error)
- **Specific**: 409 conflict handled in specific catch blocks (e.g., release LIVREE transition, duplicate name detection)
- **Mutations**: `try { await api... } catch { /* interceptor handles toast */ }` — empty catch is intentional

---

## 5. UI Components

### 5.1 Component Library

- **Approach**: Fully custom components (no Shadcn, MUI, or Ant Design). Headless UI used only for `Dialog` (modal transitions).
- **Component count**: 18 reusable components in `/components/ui/` + 3 layout components

### 5.2 Key Reusable Components

| Component | Description | Key Features |
|-----------|-------------|--------------|
| `DataTable<T>` | Generic sortable/paginated table | Column config, sort (asc/desc/tiebreaker), pagination (Previous/Next), expandable rows, null-safe sorting |
| `TableToolbar` | Search + export + settings toolbar | Search input, Excel export button, column settings popup with DnD reorder |
| `Modal` | Headless UI Dialog wrapper | Title, actions, close on escape, enter/exit transitions |
| `Combobox<T>` | Generic searchable dropdown | Filter, click-outside close, clear button, custom label/filter functions |
| `ProjetTreeTable` | Hierarchical project/WP table | Expand/collapse, add child WP, flat mode for search, type-based icons |
| `LivrableModal` | Shared livrable CRUD form | Create/edit mode, type-conditional fields (EVENT vs ACTIVITY), Zod validation |
| `ConfirmDeleteModal` | Delete confirmation dialog | Entity name display, optional name confirmation input, cascade warning |
| `AssignmentModal` | Resource assignment modal | Bulk save, percentage validation (total ≤ 100%), add/remove assignments |
| `WpHierarchySvg` | SVG work-package hierarchy | Tree layout algorithm, connector lines, status coloring |
| `DiagramExporter` | Diagram export utility | SVG/PNG/JPG formats, html-to-image conversion |

### 5.3 Complex / Domain-Specific Components

| Component | Description | Complexity Notes |
|-----------|-------------|-----------------|
| `sweet-gantt` (library) | Interactive Gantt chart | Drag-to-move/resize bars, view modes (month/quarter/year), milestone markers, SVG export — separate npm package |
| `sweet-release-grid` (library) | Release→Livrable hierarchical grid | @dnd-kit drag-and-drop to move livrables between releases — separate npm package |
| `ProjetTreeTable` | Project/WP tree table | Recursive tree rendering, expand/collapse, flat search mode |
| `WpHierarchySvg` | SVG hierarchy diagram | Custom tree layout algorithm, connector lines, dynamic sizing |

---

## 6. Page Patterns

### 6.1 List Page Pattern

```
1. useState for data, loading, search (filterTerm)
2. useEffect for initial fetch (fetchData)
3. useCrudModal<Entity, Form> for CRUD modal state
4. useDeleteConfirm<Entity> for delete confirmation
5. useTableSettings(defaultVisible, rowsPerPage, defaultOrder, storageKey) for table config
6. useMemo for search filtering (client-side, searches visible columns)
7. Render: MainLayout > Card > TableToolbar + DataTable + Modals
```

### 6.2 Detail Page Pattern

```
1. fetchAll() with Promise.allSettled for all related data
2. Primary entity (must succeed) + secondary data (empty fallback on failure)
3. initialLoadDone ref to avoid remount on refetch
4. useTabFromUrl hook syncs activeTab state to ?tab= URL parameter
5. Tabs component with controlled activeTab state
6. Each tab receives: shared data (props) + onRefresh callback
7. Each tab manages its own modal/form/filter state
8. Dynamic imports with { ssr: false } for browser-only tabs (Gantt)
```

### 6.3 CRUD Modal Pattern

```
useCrudModal<T, F>(defaultForm, toForm?) →
  { modalOpen, form, editItem, isEditing, setForm, openCreate, openEdit, close, startSaving, stopSaving }

useFormValidation(zodSchema) →
  { errors, validate, fieldError, clearErrors }

Flow: openCreate/openEdit → fill form → validate (Zod) → API call → close → onRefresh → success toast
```

### 6.4 Settings / Draft-Apply Pattern

```
1. Live state (showX, columnOrder, rowsPerPage) + Draft state (draftX)
2. settingsOpen boolean controls popup visibility
3. On open (openSettings): copy live → draft
4. On Apply (applySettings): commit draft → live, persist to localStorage
5. On Cancel (cancelSettings): discard draft, close popup
6. Gear icon (Settings from lucide) + absolute-positioned popup (z-50) with toggle switches + Apply/Cancel
```

---

## 7. Custom Hooks

| Hook | Purpose | Used By |
|------|---------|---------|
| `useTableSettings` | Column visibility, order (DnD), rows/page. Persists to localStorage via `storageKey`. Draft/apply pattern. | All list pages, detail table tabs |
| `useTeamCRUD` | Team member CRUD: add via Combobox, update roles, remove. Entity-agnostic (Projet + Produit). | TeamTab (projet + produit) |
| `useAssignment` | Resource assignment logic: add/remove assignments, percentage validation. | AssignmentModal, ReleasesTab |
| `useCrudModal<T, F>` | Modal open/close, form state, edit mode detection, `toForm` converter for edit pre-fill. | All CRUD pages and tabs |
| `useDeleteConfirm<T>` | Two-step delete: requestDelete → confirm → handleConfirmed. Manages `itemToDelete` state. | All list pages and tabs |
| `useFormValidation` | Zod schema validation with per-field error state. `validate(form)` returns boolean + sets `errors`. | All forms |
| `useSettingsPopup` | Generic draft/apply/cancel state for settings popups. Used by Gantt views and diagram exporters. | SyntheseTab, RoadmapTab |
| `useTabFromUrl` | Syncs active tab index to URL `?tab=` query parameter. Bidirectional: URL changes tab, tab changes URL. | All detail pages |
| `useWideMode` | Toggles max-width between constrained (max-w-7xl) and full-width layout. Persists to localStorage. | Navbar |

---

## 8. TypeScript Types

### 8.1 Organization

- **Location**: `src/types/index.ts` (single file, 490 lines)
- **Enums**: Union types (e.g., `type StatutProjet = "INITIATION" | "EN_COURS" | "TERMINE" | "SUSPENDU"`) — not TypeScript enums
- **Forms**: Separate form interfaces defined inline in page/component files (not centralized)
- **Entity count**: 20 interfaces + 17 union types

### 8.2 Type Mapping with Backend

- Mirror of backend Java entities — same field names (French domain vocabulary: `datePrevue`, `dateReelle`, `statut`)
- Dates as ISO 8601 strings (`"YYYY-MM-DD"`), UUIDs as strings
- Enums as union types matching Java enum constant names exactly
- Nullable fields use `string | null` (not optional)

---

## 9. Styling

### 9.1 Approach

- **Framework**: Tailwind CSS 4 (utility-first, via `@tailwindcss/postcss`)
- **Custom CSS**: `globals.css` for Airbus brand color overrides only (`@theme inline` block)
- **No**: CSS modules, styled-components, CSS-in-JS

### 9.2 Branding / Theme

| Token | Value | Usage |
|-------|-------|-------|
| Primary (indigo-500) | `#00A3E0` | Buttons, links, active states, focus rings |
| Dark (indigo-600) | `#00205B` | Navbar logo, headings, hover states |
| indigo-50 | `#e6f5fc` | Active nav item background, selected states |
| Success | `#22C55E` (green-500) | Success toasts, DONE/TERMINE badges |
| Warning | `#EAB308` (yellow-500) | IN_PROGRESS/EN_COURS badges |
| Error | `#EF4444` (red-500) | Error toasts, LATE badges, high-risk indicators |
| Background | `#FFFFFF` | Page background |
| Surface | `#FFFFFF` | Cards, modals |
| Border | `#E5E7EB` (gray-200) | Table borders, dividers |

The Airbus palette overrides both `--color-indigo-*` and `--color-blue-*` Tailwind scales.

### 9.3 Responsive Design

- **Desktop-first**: Application designed primarily for desktop use (≥1024px)
- **Wide mode**: Toggle in navbar switches between `max-w-7xl` (constrained) and `max-w-full` (wide)
- **Tables**: `overflow-x-auto` for horizontal scrolling on smaller screens
- **No mobile-specific layout**: No responsive breakpoint handling for mobile/tablet

---

## 10. Internationalization (i18n)

### 10.1 Setup

- **Library**: react-i18next + i18next + i18next-browser-languagedetector
- **Languages**: EN (default), FR, DE
- **Detection**: localStorage (`atom_locale`) → browser language → fallback (EN)
- **Persistence**: `atom_locale` key in localStorage (managed by i18next-browser-languagedetector)
- **Hydration safety**: I18nProvider delays rendering until after first client-side mount

### 10.2 Translation Structure

```
i18n/locales/
├── en/
│   ├── common.json      (43 keys)
│   ├── enums.json       (56 keys)
│   ├── nav.json         (17 keys)
│   ├── components.json  (82 keys)
│   ├── settings.json    (22 keys)
│   ├── produits.json    (111 keys)
│   ├── projets.json     (247 keys)
│   ├── ressources.json  (93 keys)
│   ├── releases.json    (27 keys)
│   └── dashboards.json  (36 keys)
├── fr/   (same structure, 734 keys)
└── de/   (same structure, 734 keys)
```

### 10.3 Namespace Convention

| Namespace | Scope |
|-----------|-------|
| `common` | Shared labels (Save, Cancel, Delete, Loading, errors) |
| `enums` | Enum display values (StatutProjet.EN_COURS → "In Progress") |
| `nav` | Navigation menu items, breadcrumb labels, logout |
| `components` | Reusable UI component strings (DataTable, Modal, Toolbar) |
| `settings` | Settings modal (roles, UI config) |
| `produits` | Product list + product detail pages |
| `projets` | Project list + project detail (all 9 tabs) |
| `ressources` | Resource list + resource detail |
| `releases` | Release detail page |
| `dashboards` | Dashboard pages (projets, ressources, alertes) |

---

## 11. Build & Development

### 11.1 Commands

```bash
npm run dev          # Dev server on localhost:3000 (--webpack flag)
npm run build        # Production build (includes TypeScript checks, --webpack flag)
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without emitting
```

### 11.2 Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20+ |
| npm | 10+ |
| Backend | Running on localhost:8080 |

### 11.3 Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` |

---

## 12. Security & Limitations

### 12.1 Authentication

- Demo-mode login: email + password form calls `POST /api/auth/login`, stores `Utilisateur` object in localStorage (`atom_user`)
- No real JWT/session tokens — no Authorization header sent with API calls
- Auth state managed via React Context (`AuthProvider`)

### 12.2 XSS / Input Sanitization

- React's default JSX escaping prevents XSS in rendered output
- i18next `interpolation.escapeValue` set to `false` (React already handles escaping)
- No additional input sanitization layer

### 12.3 Known Limitations

- No SSR — everything is client-rendered (except root layout)
- No service worker / offline support
- No automated E2E tests
- No real authentication (demo mode with hardcoded users)
- No HTTPS in development
- API client requires backend running on localhost:8080
- `gantt-task-react` and `@dnd-kit` installed with `--legacy-peer-deps` due to React 19 peer dependency conflicts
