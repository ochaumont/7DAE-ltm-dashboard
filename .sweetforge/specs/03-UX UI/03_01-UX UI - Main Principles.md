# UX/UI — Main Principles

> Design principles, global layout, navigation, page templates, interaction patterns, visual identity, component catalog, and UI states for the ATOM Project Management frontend.

---

## 1. Application Info

| Property | Value |
|----------|-------|
| Application | ATOM Project Management |
| Version | 0.1.0 |
| Design Tool | None (no Figma/Sketch) |
| Design System | Custom (Tailwind CSS utility classes + custom components) |

---

## 2. Design Principles

1. **Simplicity** — Flat navigation (top navbar), minimal nesting. Most features reachable in 2 clicks.
2. **Consistency** — Same patterns everywhere: CRUD modals, DataTable layout, toast feedback, settings popups.
3. **Data density** — Tables for all list views (not cards). Maximum useful information per screen.
4. **Progressive disclosure** — Summary first (KPI cards), details on demand (tabs, expandable rows, modals).

---

## 3. Global Layout

- **Type**: Single Page App
- **Shell**: Navbar (top, fixed height h-16) + Breadcrumb + Main Content Area. No sidebar. No footer.

### Layout Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  ATOM PM  [Dashboard] [Projects] [Products] [Resources]         │
│                                   [⤢] [🔔] [⚙] [🇬🇧▾] [👤]   │
├──────────────────────────────────────────────────────────────────┤
│  Breadcrumb: Home > Entity List > Entity Name                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Main Content Area (max-w-7xl or full-width via wide mode)      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Page content (cards, tables, tabs)                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Navbar Elements

| Element | Description |
|---------|-------------|
| Logo | "ATOM PM" text, indigo-600 color, links to /dashboard |
| Navigation links | Dashboard, Projects, Products, Resources — with lucide icons, active item has indigo-50 bg |
| Wide mode toggle | Maximize2/Minimize2 icon — toggles max-w-7xl vs max-w-full |
| Notifications | Bell icon with badge count (static "3") |
| Settings | Gear icon → opens SettingsModal (3 sections: app roles, user roles CRUD, UI config) |
| Language switcher | Flag dropdown (UK/FR/DE SVG flags) → i18n.changeLanguage() |
| Profile | UserCircle icon → dropdown with name, role, date format toggle (FR/EN), logout |

### Breadcrumb

- Auto-generated from route hierarchy
- Clickable parent segments
- Pattern: Dashboard > Entity List > Entity Name
- Detail pages can override with custom breadcrumb items (e.g., WP chain)

---

## 4. Navigation

- **Primary**: Top navbar with 4 sections (Dashboard, Projects, Products, Resources)
- **Secondary**: Tabs within detail pages
- **Contextual**: Row click → detail page, breadcrumb back

### Menu Structure

| Label | Route | Icon | Access |
|-------|-------|------|--------|
| Dashboard | /dashboard | LayoutDashboard | All (redirects by role) |
| Projects | /projets | FolderKanban | CP, Manager |
| Products | /produits | Package | PO |
| Resources | /ressources | Users | All |

### Role-Based Navigation

| Role | Landing Page | Visible Sections |
|------|-------------|-----------------|
| Product Owner (PO) | /produits | Products, Resources, Dashboard |
| Chef de Projet (CP) | /projets | Projects, Resources, Dashboard |
| Manager | /dashboard/projets | Dashboard, Projects, Products, Resources |

### URL Structure

```
/produits                          → Product list
/produits/{id}                     → Product detail (tabs via ?tab=)
/produits/{id}/releases/{releaseId}→ Release detail
/projets                           → Project/WP tree list
/projets/{id}                      → Project detail (?tab=synthese|milestones|phases|...)
/ressources                        → Resource list
/ressources/{id}                   → Resource detail (?tab=profil|conges|charge|capacite)
/dashboard/projets                 → Manager: project dashboard
/dashboard/ressources              → Manager: resource capacity
/dashboard/alertes                 → Manager: planning alerts
```

---

## 5. Page Templates

### 5.1 List Page

```
┌─────────────────────────────────────┐
│  Page Title              [+ Create] │
├─────────────────────────────────────┤
│  TableToolbar                       │
│  [Search] [Filters] [Export] [⚙]   │
├─────────────────────────────────────┤
│  DataTable                          │
│  Column A ▲ | Column B | Actions   │
│  row 1     |          | ✏️ 🗑️      │
│  row 2     |          | ✏️ 🗑️      │
├─────────────────────────────────────┤
│  Pagination: ◄ Page 1 of 3 ►       │
└─────────────────────────────────────┘
```

**Standard features**: Search bar (client-side), column visibility/order settings (gear), sortable columns, pagination (configurable rows/page), row click → detail, action column (edit/delete icons), Excel export.

### 5.2 Detail Page

```
┌─────────────────────────────────────┐
│  Entity Name            [Edit][Del] │
├─────────────────────────────────────┤
│  [Tab 1] [Tab 2] [Tab 3] [Tab 4]   │
├─────────────────────────────────────┤
│                                     │
│  Tab Content                        │
│  (KPI cards, tables, forms, etc.)   │
│                                     │
└─────────────────────────────────────┘
```

**Standard features**: Header with entity name + action buttons, tab navigation (controlled state, synced to URL ?tab=), each tab self-contained, refresh without remounting tabs.

### 5.3 Dashboard Page

```
┌─────────────────────────────────────┐
│  Dashboard Title                    │
├──────────┬──────────┬───────────────┤
│ KPI Card │ KPI Card │ KPI Card      │
├──────────┴──────────┴───────────────┤
│  DataTable / Chart / Alert cards    │
└─────────────────────────────────────┘
```

### 5.4 Settings Modal (no separate page)

3 sections in a modal: Application roles (read-only), User roles (CRUD), UI configuration (radio buttons persisted to localStorage `atom_settings`).

---

## 6. Interaction Patterns

### 6.1 CRUD Modal

```
Trigger:   [+ Create] button  or  ✏️ edit icon
Opens:     Modal with form fields (Headless UI Dialog + transitions)
Actions:   [Cancel] [Save]
On save:   Validate (Zod) → API call → Close modal → Refresh data → Toast
On cancel: Discard changes → Close modal
```

- **Create mode**: Empty form, "Create" title.
- **Edit mode**: Pre-filled via `toForm()`, "Edit" title.
- **Validation**: Inline field errors (Zod schema).
- **Duplicate**: 409 → specific error message.

### 6.2 Delete Confirmation

```
Trigger:   🗑️ trash icon (with e.stopPropagation to prevent row click)
Opens:     ConfirmDeleteModal — "Are you sure you want to delete {name}?"
Actions:   [Cancel] [Delete]
On delete: API call → Close → Refresh → Toast
Blocked:   409 if entity has children → error message
Optional:  requireNameConfirmation flag for extra safety
```

### 6.3 Table Interactions

| Interaction | Behavior |
|-------------|----------|
| Row click | Navigate to detail page |
| Column header click | Toggle sort (asc/desc) |
| Gear icon | Open settings popup (column visibility, order, rows/page) |
| Search | Client-side filter across visible columns |
| Export | Download Excel file (.xlsx) with current data |
| Drag & drop | Reorder columns in settings popup |

### 6.4 Settings Popup (Draft/Apply)

```
1. Click gear icon → popup opens (absolute positioned, z-50)
2. Current settings copied to draft
3. User modifies draft (toggles for column visibility, DnD for order)
4. [Apply] → commit draft to live state, persist to localStorage
5. [Cancel] → discard draft, close popup
```

### 6.5 Drag & Drop

| Context | What is dragged | Where | Library |
|---------|----------------|-------|---------|
| Column reorder | Column entries | TableToolbar settings popup | @dnd-kit/sortable |
| Livrable move | Livrable rows | ReleaseGrid (between releases) | @dnd-kit/core |
| Gantt bar | Timeline bar | ProductGantt/ProjectGantt | Custom (mouse events) |

---

## 7. Visual Identity

### 7.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #00A3E0 | Buttons, links, active states, focus rings |
| Primary Dark | #00205B | Navbar logo, headings, hover states |
| Success | #22C55E | Success toasts, DONE badges, Gantt complete |
| Warning | #EAB308 | IN_PROGRESS badges, attention alerts |
| Error | #EF4444 | Error toasts, LATE badges, high-risk |
| Info | #3B82F6 | PLANIFIEE badges |
| Background | #F9FAFB | Page background (gray-50) |
| Surface | #FFFFFF | Cards, modals |
| Border | #E5E7EB | Table borders, dividers |

### 7.2 Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Body | Arial, Helvetica, sans-serif | 14px (text-sm) | Normal |
| Heading 1 | Geist Sans | 24px (text-2xl) | Bold |
| Heading 2 | Geist Sans | 20px (text-xl) | Semibold |
| Table header | Geist Sans | 12px (text-xs) | Medium, uppercase |
| Table cell | Geist Sans | 14px (text-sm) | Normal |
| Label | Geist Sans | 12px (text-xs) | Medium |

### 7.3 Iconography

- **Library**: lucide-react
- **Size**: 16px (h-4 w-4) in tables/buttons, 20px (h-5 w-5) in navbar
- **Style**: Outline, consistent stroke width

| Action | Icon |
|--------|------|
| Create | Plus |
| Edit | Pencil |
| Delete | Trash2 |
| Settings | Settings (gear) |
| Search | Search |
| Export | Download |
| Expand | ChevronRight / ChevronDown |
| Dashboard | LayoutDashboard |
| Projects | FolderKanban |
| Products | Package |
| Resources | Users |
| Notifications | Bell |
| Logout | LogOut |
| Wide mode | Maximize2 / Minimize2 |
| Profile | UserCircle |

### 7.4 Spacing & Layout

- **Grid**: Tailwind default (4px base unit)
- **Page container**: max-w-7xl (or full-width in wide mode), px-4 sm:px-6 lg:px-8
- **Card padding**: p-4 to p-6
- **Table cell padding**: px-6 py-4 (body), px-6 py-3 (header)
- **Gap between elements**: gap-4 (16px)

---

## 8. Component Catalog

### 8.1 Buttons

| Variant | Usage | Style |
|---------|-------|-------|
| Primary | Main actions (Save, Create) | bg-indigo-600 text-white, hover:bg-indigo-700 |
| Secondary | Alternative actions (Cancel) | bg-white border-gray-300, hover:bg-gray-50 |
| Danger | Destructive actions (Delete) | bg-red-600 text-white, hover:bg-red-700 |
| Ghost | Subtle actions (toggle) | text-gray-600, hover:bg-gray-100 |

### 8.2 Forms

| Element | Pattern |
|---------|---------|
| Text input | Label above, placeholder, red border + error message below on validation fail |
| Select | Native select for simple lists |
| Combobox | Searchable dropdown for large lists (resources, teams) |
| Date picker | Native input[type=date] |
| Textarea | For descriptions, comments |
| Number input | For percentages, estimations |

### 8.3 Data Display

| Component | Usage |
|-----------|-------|
| DataTable | Sortable, paginated, configurable columns — all list views |
| ProjetTreeTable | Hierarchical project/WP table with expand/collapse |
| KpiCard | Numeric summary with label and icon (dashboard, synthese) |
| Badge | Status/priority display with semantic colors |
| Tabs | Section switching within detail pages |
| WpHierarchySvg | SVG tree visualization of work-package hierarchy |

### 8.4 Feedback

| Component | Usage |
|-----------|-------|
| Toast (sonner) | Success/error notifications (auto-dismiss), positioned top-right with richColors |
| Modal | CRUD forms, confirmations, settings (Headless UI Dialog) |
| PageSkeleton | Loading state on initial page fetch |
| Inline validation | Per-field error messages in forms (red text below field) |

### 8.5 Data Visualization

| Component | Usage | Notes |
|-----------|-------|-------|
| ProductGantt (sweet-gantt) | Timeline view of releases | Custom CSS bars, drag-to-move/resize, view modes |
| ProjectGantt (sweet-gantt) | Timeline view of milestones + phases | gantt-task-react wrapper, status coloring |
| MilestoneProgressCard (SyntheseTab) | SVG milestone-to-phase diagram | Custom SVG, circles + boxes + connectors |
| Risk matrix (implicit) | Probability x Impact grid | 3x3 color-coded cells in RisquesTab |

---

## 9. UI States

### 9.1 Loading States

| Context | Behavior |
|---------|----------|
| Initial page load | PageSkeleton component (shimmer effect) |
| Data refetch | No spinner — silent refresh (initialLoadDone ref prevents remount) |
| Lazy tab load | Spinner within tab area until data loads |
| Modal save | Button disabled during API call |

### 9.2 Empty States

| Context | Display |
|---------|---------|
| Empty table | "No data found" centered in table body (translated) |
| Empty search | "No results match your search" |
| Empty tab | Contextual message |

### 9.3 Error States

| Context | Display |
|---------|---------|
| API error | Toast notification (automatic from Axios interceptor) |
| Form validation | Inline error per field (red border + message) |
| Network failure | Toast "Network error — server may be unavailable" |
| 409 conflict | Toast with specific server message |

---

## 10. Accessibility

- **Target**: Best effort (not WCAG AA certified)
- **Semantic HTML**: Tables use proper thead/tbody/th/td
- **ARIA attributes**: aria-sort on sortable column headers, aria-expanded on expandable rows
- **Keyboard**: Tab navigation, Enter/Space to activate, Escape to close modals/popups
- **Focus management**: Focusable sort headers (tabIndex=0), focus ring (ring-2 ring-blue-500)

---

## 11. Responsive Design

| Breakpoint | Behavior |
|------------|----------|
| Desktop (>1024px) | Full layout, all features |
| Tablet/Mobile | Not specifically targeted — tables scroll horizontally, navbar does not collapse |
| Wide mode | Toggle between max-w-7xl and max-w-full (user preference) |

---

## 12. Branding

- **Logo**: "ATOM PM" text in indigo-600 (Airbus light blue), positioned top-left in navbar
- **Color overrides**: Airbus corporate blue (#00A3E0 primary, #00205B dark) replaces Tailwind's indigo and blue palettes in globals.css
- **Fonts**: Geist Sans + Geist Mono (Google Fonts), fallback: Arial, Helvetica, sans-serif
- **White-labeling**: Not supported — colors are hardcoded in CSS custom properties
