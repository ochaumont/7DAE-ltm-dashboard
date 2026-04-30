# Frontend Technical Architecture

> Technical architecture reference for the frontend: stack, patterns, components, state management, and conventions.

---

## 1. Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | _e.g. Next.js (App Router)_ | _e.g. 16_ |
| Language | _e.g. TypeScript_ | — |
| Runtime | _e.g. React_ | _e.g. 19_ |
| Styling | _e.g. Tailwind CSS_ | — |
| HTTP Client | _e.g. Axios_ | — |
| Form Validation | _e.g. Zod_ | — |
| i18n | _e.g. react-i18next_ | — |
| Icons | _e.g. lucide-react_ | — |
| Modals / Dialogs | _e.g. @headlessui/react_ | — |
| Drag & Drop | _e.g. @dnd-kit/core + @dnd-kit/sortable_ | — |
| Toast / Notifications | _e.g. sonner_ | — |
| Export | _e.g. xlsx_ | — |
| CSS Utilities | _e.g. clsx_ | — |

---

## 2. Architecture

### 2.1 Rendering Strategy

<!-- Describe the rendering approach: SSR, CSR, SSG, ISR, hybrid, etc. -->

- **Strategy**: _e.g. Fully client-side ("use client" on all pages)_
- **Rationale**: _e.g. Pervasive interactivity (modals, forms, drag-and-drop) makes SSR impractical_

### 2.2 Folder Structure

```
src/
├── app/                        # Pages (routing)
│   ├── page.tsx                # Root / entry point
│   ├── layout.tsx              # Root layout (providers)
│   ├── globals.css             # Global styles / brand overrides
│   ├── login/
│   ├── dashboard/
│   │   └── ...
│   ├── entityA/
│   │   ├── page.tsx            # List page
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Detail page (orchestrator)
│   │   │   └── tabs/           # Tab components
│   │   └── components/         # Entity-specific components
│   └── ...
├── components/
│   ├── layout/                 # Navbar, Sidebar, Breadcrumb, MainLayout
│   └── ui/                     # Reusable UI components
│       ├── DataTable.tsx
│       ├── Modal.tsx
│       ├── Combobox.tsx
│       └── ...
├── hooks/                      # Custom hooks
├── lib/                        # Utilities and services
│   ├── api.ts                  # API client (typed functions)
│   ├── auth.tsx                # Auth context
│   ├── constants.ts            # Shared constants
│   ├── schemas.ts              # Validation schemas
│   └── ...
├── types/
│   └── index.ts                # TypeScript interfaces and types
└── i18n/
    └── locales/                # Translation files
        ├── en/
        ├── fr/
        └── ...
```

### 2.3 Routing

<!-- Describe the routing approach: file-based, programmatic, conventions -->

- **Router**: _e.g. Next.js App Router (file-based)_
- **Dynamic routes**: _e.g. [id] segments for detail pages_
- **Role-based redirects**: _e.g. Root redirect based on user role (PO → /products, PM → /projects)_
- **Protected routes**: _e.g. Auth guard mechanism_

---

## 3. State Management

### 3.1 Strategy

<!-- Describe the overall state management approach -->

- **Global state**: _e.g. React Context (auth), no external store (Redux, Zustand)_
- **Local state**: _e.g. useState + useEffect per page/component_
- **Server state**: _e.g. useEffect + fetch, no React Query / SWR_

### 3.2 Data Fetching Pattern

<!-- Describe how data is loaded -->

```
e.g.
1. useEffect on mount triggers fetchAll()
2. Promise.all / Promise.allSettled for parallel fetches
3. Loading state wraps the entire UI
4. initialLoadDone ref to skip loading spinner on refetch (prevents child unmount)
```

### 3.3 Local Persistence (localStorage / sessionStorage)

| Key | Content | Scope |
|-----|---------|-------|
| _e.g. app_user_ | _Logged-in user (JSON)_ | _Session_ |
| _e.g. app_locale_ | _Selected language_ | _Preference_ |
| _e.g. app_settings_ | _UI filter config_ | _Preference_ |
| _e.g. app_table_{key}_ | _Table settings (columns, sort, rows/page)_ | _Per table_ |

---

## 4. API Client

### 4.1 Configuration

<!-- Describe the HTTP client setup -->

- **Library**: _e.g. Axios_
- **Base URL**: _e.g. http://localhost:8080/api_
- **Interceptors**: _e.g. Response interceptor shows toast on 4xx/5xx_
- **Auth headers**: _e.g. None (simulated auth) / Bearer token_

### 4.2 Function Pattern

<!-- Describe how API functions are organized -->

```typescript
// e.g. One typed function per endpoint
export async function getEntities(): Promise<Entity[]> { ... }
export async function createEntity(data: EntityForm): Promise<Entity> { ... }
```

### 4.3 Error Handling

<!-- How API errors are surfaced to the user -->

- **Global**: _e.g. Axios interceptor → toast notification_
- **Specific**: _e.g. 409 conflict handled in catch blocks for certain operations_
- **Mutations**: _e.g. try-catch wrapper (catch can be empty since interceptor handles toast)_

---

## 5. UI Components

### 5.1 Component Library

<!-- Is the project using a UI library or custom components? -->

- **Approach**: _e.g. Fully custom components / Shadcn / MUI / Ant Design_
- **Component count**: _e.g. 30+ reusable components in /components/ui/_

### 5.2 Key Reusable Components

<!-- List the most important shared components and their features -->

| Component | Description | Key Features |
|-----------|-------------|--------------|
| _e.g. DataTable\<T\>_ | _Generic sortable/paginated table_ | _Column config, sort, pagination_ |
| _e.g. Modal_ | _Reusable modal dialog_ | _Title, actions, close on escape_ |
| _e.g. Combobox\<T\>_ | _Searchable dropdown_ | _Filter, click-outside, clear button_ |
| _e.g. Tabs_ | _Tab container_ | _Controlled active tab_ |

### 5.3 Complex / Domain-Specific Components

<!-- Describe any complex components that warrant detailed documentation -->

| Component | Description | Complexity Notes |
|-----------|-------------|-----------------|
| _e.g. Gantt chart_ | _Interactive timeline_ | _Drag-to-move/resize, view modes, no external library_ |
| _e.g. TreeTable_ | _Expandable hierarchy_ | _Drag-and-drop reorder, nested data_ |
| _e.g. SVG Diagram_ | _Visual hierarchy_ | _Tree layout algorithm, connector lines_ |

---

## 6. Page Patterns

### 6.1 List Page Pattern

<!-- Describe the standard approach for list/index pages -->

```
e.g.
1. useState for data, loading, search
2. useEffect for initial fetch
3. useCrudModal<Entity, Form> for CRUD modal
4. useDeleteConfirm<Entity> for delete confirmation
5. useTableSettings for table configuration
6. useMemo for search filtering
7. Render: MainLayout > Card > TableToolbar + DataTable + Modals
```

### 6.2 Detail Page Pattern

<!-- Describe the standard approach for detail/edit pages -->

```
e.g.
1. fetchAll() with Promise.allSettled for all related data
2. initialLoadDone ref to avoid remount on refetch
3. Tabs component with controlled activeTab state
4. Each tab receives: shared data (props) + onRefresh callback
5. Each tab manages its own modal/form/filter state
```

### 6.3 CRUD Modal Pattern

<!-- Describe the create/edit modal flow -->

```
e.g.
useCrudModal<T, F>(defaultForm, toForm?) →
  { modalOpen, form, editItem, isEditing, setForm, openCreate, openEdit, close }

useFormValidation(zodSchema) →
  { errors, validate, fieldError, clearErrors }

Flow: openCreate/openEdit → fill form → validate → API call → close → onRefresh
```

### 6.4 Settings / Draft-Apply Pattern

<!-- Describe patterns for settings popups with draft state -->

```
e.g.
1. Live state + Draft state
2. On open: copy live → draft
3. On Apply: commit draft → live
4. On Cancel: discard draft
```

---

## 7. Custom Hooks

<!-- List custom hooks and their purpose -->

| Hook | Purpose | Used By |
|------|---------|---------|
| _e.g. useTableSettings_ | _Table column visibility, order, rows/page_ | _All list pages_ |
| _e.g. useCrudModal_ | _Modal open/close, form state, edit mode_ | _All CRUD pages_ |
| _e.g. useDeleteConfirm_ | _Delete confirmation dialog_ | _All list pages_ |
| _e.g. useFormValidation_ | _Zod schema validation + field errors_ | _All forms_ |
| _e.g. useTeamCRUD_ | _Team member CRUD operations_ | _Project/Product detail_ |

---

## 8. TypeScript Types

### 8.1 Organization

<!-- How types are organized -->

- **Location**: _e.g. src/types/index.ts (single file) / per-domain files_
- **Enums**: _e.g. Union types (`type Status = 'ACTIVE' | 'INACTIVE'`) / TypeScript enums_
- **Forms**: _e.g. Separate form interfaces alongside entity interfaces_

### 8.2 Type Mapping with Backend

<!-- How frontend types relate to backend models -->

- _e.g. Mirror of backend entities — same field names and types_
- _e.g. Dates as strings (ISO 8601), UUIDs as strings_
- _e.g. Enums as union types, not TypeScript enums_

---

## 9. Styling

### 9.1 Approach

<!-- Describe the styling strategy -->

- **Framework**: _e.g. Tailwind CSS (utility-first)_
- **Custom CSS**: _e.g. globals.css for brand overrides only_
- **No**: _e.g. CSS modules, styled-components, CSS-in-JS_

### 9.2 Branding / Theme

<!-- Describe brand color overrides or theming -->

| Token | Value | Usage |
|-------|-------|-------|
| _e.g. Primary_ | _#00A3E0_ | _Buttons, links, active states_ |
| _e.g. Dark_ | _#00205B_ | _Navbar, headings_ |

### 9.3 Responsive Design

<!-- Describe the responsive strategy: breakpoints, mobile-first, desktop-only, etc. -->

---

## 10. Internationalization (i18n)

### 10.1 Setup

- **Library**: _e.g. react-i18next_
- **Languages**: _e.g. EN (default), FR, DE_
- **Detection**: _e.g. Browser language auto-detection_
- **Persistence**: _e.g. localStorage key_

### 10.2 Translation Structure

<!-- How translation files are organized -->

```
e.g.
i18n/locales/
├── en/
│   ├── common.json
│   ├── nav.json
│   ├── entities.json
│   └── ...
├── fr/
└── de/
```

### 10.3 Namespace Convention

<!-- How namespaces map to features/domains -->

| Namespace | Scope |
|-----------|-------|
| _e.g. common_ | _Shared labels (Save, Cancel, Delete...)_ |
| _e.g. nav_ | _Navigation and menu items_ |
| _e.g. enums_ | _Enum display values_ |
| _e.g. entities_ | _Entity-specific labels_ |

---

## 11. Build & Development

### 11.1 Commands

```bash
# Dev server
# Production build
# Lint
# Type check
```

### 11.2 Prerequisites

| Tool | Minimum Version |
|------|----------------|
| _e.g. Node.js_ | _20+_ |
| _e.g. npm_ | _10+_ |

### 11.3 Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| _e.g. NEXT_PUBLIC_API_URL_ | _Backend API base URL_ | _http://localhost:8080/api_ |

---

## 12. Security & Limitations

### 12.1 Authentication

<!-- How auth is handled on the frontend: token storage, auth guards, etc. -->

### 12.2 XSS / Input Sanitization

<!-- Describe any input sanitization or XSS prevention measures -->

### 12.3 Known Limitations

- _e.g. No SSR — everything is client-rendered_
- _e.g. No service worker / offline support_
- _e.g. No automated E2E tests_
