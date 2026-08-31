# Architecture

## Routes and rendering
Every route under `app/` follows the same pattern: a thin server component (the `page.tsx`) fetches data once and hands it as props to a `"use client"` component that owns state, effects, and any browser-only APIs.

| Route | Server shell | Client component |
|---|---|---|
| `/` | `app/page.tsx` | `CatalogueClient` |
| `/map` | `app/map/page.tsx` (+ `app/map/layout.tsx`) | `MapClient` (MapLibre, `ssr: false`) |
| `/labtestmean` | `app/labtestmean/page.tsx` | `LabTestMeanDetailClient` (reads `?id=`) |
| `/depgraph` | `app/depgraph/page.tsx` | `InteractionClient` → `components/interaction/DependencyGraph.tsx` |
| `/depview` | `app/depview/page.tsx` | `RadarClient` → `components/radar/CircularGraph.tsx` |
| `/health` | `app/health/route.ts` | — (static JSON route) |

`/labtestmean` is intentionally a single static page reading `id` via `useSearchParams()` rather than a dynamic `[externalId]` segment: under `output: "export"` a dynamic segment would require pre-generating every id, which the query-param form avoids.

## Data flow
- `lib/atom-api.ts` fetches from `{NEXT_PUBLIC_ATOM_API_BASE_URL}/api/infos/labtestmeans[...]`, throwing `AtomApiError` on network failure.
- `lib/labtestmean-adapter.ts` maps the backend DTO to the frontend `LabTestMean` model, including deriving `status` from lifecycle dates and building the relation lists (`LTMDependsOn`, `LTMSupports`, `SharedResourcesDependsOn`) consumed by the dependency graph/view.
- Filtering (catalogue, map, dependency view) happens client-side over the array passed down from the server component.

## Theming: two orthogonal axes
This is the app's central styling idea:

1. **Light ↔ dark** — a user preference on `[data-theme]` at the document root. All color tokens (`--color-bg`, `--color-fg`, `--color-accent`, etc.) live in two blocks in `app/globals.css`. An inline anti-FOUC script applies the stored/OS preference before first paint; other consumers (e.g. map tile styling) read it through a shared `useTheme()` hook.
2. **Route theme class** — structural-only classes (`theme-industrial-premium` on `<body>`, `theme-map-first` scoped to `/map`) that adjust things like glass panels or hover glow, but never redefine color tokens. Translucent values use `color-mix(in srgb, var(--color-accent) X%, transparent)` so they adapt automatically to whichever theme is active.

Color changes belong in the `[data-theme]` blocks of `app/globals.css`; `styles/themes/*.css` is reserved for structural overrides only.

## Directory roles
- `app/` — routes only (server shells + route handlers).
- `components/` — client components, organized by feature (`interaction/`, `radar/`, `pdf/`).
- `lib/` — data fetching, adapters, types, and local-storage-backed settings (photo cache, saved diagrams, display settings).
- `public/` — static assets, including the single theme-adaptive Airbus logo (`airbus-logo.svg`, `fill="currentColor"`).
