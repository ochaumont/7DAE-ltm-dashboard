# Cross-Cutting: Internationalization (i18n)

## Overview

| Field | Value |
|-------|-------|
| Library | react-i18next 16.5.8 + i18next 25.8.18 |
| Languages | EN (default), FR, DE |
| Detection | localStorage → browser language → fallback (EN) |
| Persistence | localStorage key: `atom_locale` |
| Scope | Frontend only (backend returns raw French field names/enum values) |

## Provider Setup

1. i18n configured in `src/lib/i18n.tsx`
2. `I18nProvider` wraps the app in `layout.tsx` (after `AuthProvider`)
3. Language detector checks: localStorage (`atom_locale`) → browser navigator → fallback (EN)
4. All 10 namespaces loaded eagerly on init (bundled, not lazy)
5. Hydration-safe: delays rendering until after first client-side mount

## Language Switcher

- **Location:** Navbar, flag dropdown (right side)
- **Behavior:** Click flag → `i18n.changeLanguage(code)` + sets `document.documentElement.lang` + persists preference to backend via API
- **Available:** UK flag (EN), French tricolore (FR), German flag (DE) — inline SVG icons

## Directory Layout

```
src/i18n/locales/
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
├── fr/   (identical structure, 734 total keys)
└── de/   (identical structure, 734 total keys)
```

## Namespace Scope

| Namespace | Scope | Key Count | Description |
|-----------|-------|-----------|-------------|
| common | Shared across all pages | 43 | Save, Cancel, Delete, Loading, errors, search, filters |
| enums | Enum display values | 56 | All enum values: StatutProjet, StatutRelease, StatutLivrable, etc. |
| nav | Navigation & layout | 17 | Menu items (dashboard, projets, produits, ressources), logout, wideMode/narrowMode |
| components | Reusable UI components | 82 | DataTable (pagination, noData), Modal, Toolbar, Badge, Filter labels |
| settings | Settings modal | 22 | Role management, UI config labels |
| produits | Product pages | 111 | Product list, detail (5 tabs), release form, import flow |
| projets | Project pages | 247 | Project list, detail (9 tabs), all CRUD forms, phase/milestone/risk labels |
| ressources | Resource pages | 93 | Resource list, detail (4 tabs), leave form, capacity labels |
| releases | Release pages | 27 | Release detail page, livrable assignment labels |
| dashboards | Dashboard pages | 36 | KPI labels, alert messages, capacity visualization |

## Key Structure

```
namespace.section.element

projets.list.title          → "Projects"
projets.detail.tabs.team    → "Team"
projets.form.name           → "Project Name"
projets.form.name_required  → "Name is required"
projets.columns.status      → "Status"
projets.actions.create      → "Create Project"
projets.messages.deleted     → "Project deleted successfully"
```

## Key Naming Rules

| Pattern | Usage | Example |
|---------|-------|---------|
| `{ns}.list.title` | Page title for list page | `produits.list.title` |
| `{ns}.detail.title` | Page title for detail page | `projets.detail.title` |
| `{ns}.detail.tabs.{tab}` | Tab labels | `projets.detail.tabs.milestones` |
| `{ns}.form.{field}` | Form field labels | `produits.form.name` |
| `{ns}.form.{field}_{rule}` | Validation messages | `produits.form.name_required` |
| `{ns}.columns.{field}` | Table column headers | `ressources.columns.email` |
| `{ns}.actions.{action}` | Button/action labels | `projets.actions.create` |
| `{ns}.messages.{event}` | Success/error messages | `releases.messages.created` |
| `enums.{EnumName}.{VALUE}` | Enum display values | `enums.StatutProjet.EN_COURS` |
| `common.{label}` | Shared labels | `common.save`, `common.cancel` |
| `common.errors.{type}` | Error messages | `common.errors.validation`, `common.errors.network` |

## Usage in Components

```tsx
import { useTranslation } from 'react-i18next';
const { t } = useTranslation(['projets', 'enums', 'common']);

// Simple key
<h1>{t('list.title')}</h1>

// With namespace override
{t('save', { ns: 'common' })}

// Enum value (keys match Java enum names exactly)
{t(`StatutProjet.${project.statut}`, { ns: 'enums' })}

// With interpolation
{t('messages.deleted', { name: project.name })}
```

Shared components use the `components` namespace internally. Page-specific components use the page namespace.

## Interpolation

```json
{ "pagination": "Page {{page}} of {{total}} ({{count}} items)" }
{ "errors.validation": "Validation error: {{message}}" }
{ "errors.conflict": "Conflict: {{message}}" }
```

## Translation Completeness

All 3 languages (EN, FR, DE) have identical key counts: 734 keys each. 100% parity across all namespaces.

## Domain Language

| Aspect | Convention |
|--------|-----------|
| Entity field names | French in code (`produit`, `livrable`, `datePrevue`) matching backend model |
| API field names | French (matches backend Java model names) |
| UI labels | Translated via i18n — user sees English/French/German |
| Enum values | French constants in code (EN_COURS), translated display in UI via `enums` namespace |

## Quality

All user-visible strings use translation keys. No hardcoded text in components. All namespaces complete in all languages. Enum values translated. Validation messages translated. Toast messages translated (via Axios interceptor using i18next directly). Table column headers use translation keys. Page titles and breadcrumbs translated.
