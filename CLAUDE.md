# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace layout

Two sibling Next.js 15 apps and a specification folder at the root:

- `bench-catalog/` — the **active** project. Visual catalog of Airbus test benches (20 mock entries, filters, MapLibre view, 360° panorama viewer in bench detail). Runs on port **3001**.
- `panorama-app/` — a minimal standalone demo that renders one full-screen panorama (`public/panorama.jpg`). Default port 3000. Untouched most of the time; kept as a reference implementation for `react-photo-sphere-viewer`.
- `_specification/vibe coding/` — lightweight feature specs, one file per feature. This is where `/sweetforge.vibe` writes new specs.

Implementation plans produced by Plan mode are written to `C:\Users\olivi\.claude\plans\` (outside this workspace), not under `_specification/`.

## Commands

Both apps are plain Next.js projects with no test or lint script defined.

```bash
# bench-catalog (port 3001)
cd bench-catalog
npm install
npm run dev        # dev server
npm run build      # production build + TS check + SSG
npm start          # serve the build

# panorama-app (default port 3000)
cd panorama-app
npm install
npm run dev
npm run build
npm start
```

When a refactor deletes routes or pages, `.next/` often holds stale chunks and dev/build will throw `Cannot find module './<hash>.js'`. Fix by removing `.next/` before rebuilding: `rm -rf bench-catalog/.next`.

## bench-catalog — architecture

Big picture (reading the routes alone is not enough):

### Routes
- `/` → catalogue grid (`CatalogueClient`).
- `/map` → MapLibre full-screen view (`MapClient`), with a nested `app/map/layout.tsx` that scopes the `theme-map-first` class.
- `/bench/[id]` → detail page with photo gallery + panorama. `generateStaticParams` prerenders all 20 benches.
- There is **no** `/d/[direction]` segment and no landing page. Any reference to a "direction picker" or `directionId` prop belongs to an older iteration that has been deleted — do not reintroduce.

### Two orthogonal theming axes
This is the single most important architectural idea in `bench-catalog` and is easy to misread:

1. **Light ↔ Dark** — a user preference controlled by `[data-theme="light" | "dark"]` on `<html>`. All color tokens (`--color-bg`, `--color-fg`, `--color-accent`, `--color-success`, etc.) live in two blocks in `app/globals.css`. Structural tokens (`--font-*`, `--radius-*`) stay on bare `:root`. An inline anti-FOUC script in `<head>` (see `app/layout.tsx`) reads `localStorage.theme` or falls back to `prefers-color-scheme` before the first paint; the `ThemeToggle` (in the `Header` right slot) writes back via `lib/useTheme.ts`. Other consumers (notably `MapView` for tile style selection) read the theme through the same `useTheme()` hook, which uses `useSyncExternalStore` + `MutationObserver` on `html[data-theme]`.

2. **Route theme class** — `theme-industrial-premium` applied on `<body>` in `app/layout.tsx`; `theme-map-first` applied inside `app/map/layout.tsx`. These classes only carry **structural** overrides (the glass panel, the card hover glow). They do **not** redefine color tokens — colors come exclusively from the `[data-theme]` axis. Translucent values in those theme CSS files use `color-mix(in srgb, var(--color-accent) X%, transparent)` so they adapt automatically.

When you change colors, the default is to edit `:root[data-theme="dark"]` / `:root[data-theme="light"]` in `app/globals.css`. Touch `styles/themes/*.css` only for structural overrides that cannot be expressed as tokens.

### Data flow
- Mock data is a static JSON at `bench-catalog/data/benches.json`, imported synchronously through `lib/benches.ts`. Server components pass arrays to client components as props; filtering happens client-side.
- Every bench has an array of `photos` with optional `isPanorama: true` flag — the `Gallery` component swaps to `react-photo-sphere-viewer` for those, loaded via `next/dynamic({ ssr: false })`.
- `MapView` and `PanoramaViewer` both require the browser and are always imported via `dynamic(() => …, { ssr: false })`. Keep it that way.

### Related backend
There is a Spring Boot backend **`atom-synchronizer-dev`** served at `http://localhost:8080/atom-synchronizer-dev` with Springdoc OpenAPI at `/v3/api-docs`. Its `LabTestMean` entity (`GET /api/infos/labtestmeans`) is the intended real-world source for benches when `data/benches.json` is replaced. The OpenAPI spec covers ~42 endpoints across sync processes, ATOM reads, KPIs, and connectivity healthchecks to LeanIX / Alfabet / ADAM / Google.

## Conventions to preserve

- **Routing is URL-clean**: `/`, `/map`, `/bench/[id]`. No query-string direction parameter, no `/d/` prefix. If a link needs another view, add a top-level route — don't reintroduce a direction axis.
- **Airbus logo**: single asset `public/airbus-logo.svg` using `fill="currentColor"`. It auto-inverts via `--color-fg`. Do not add a separate dark/light logo file unless a branded asset is explicitly required.
- **Header right slot**: reserved for future avatar / global search / notifications. `ThemeToggle` is the only current tenant. Keep the slot dimensioned to avoid reflow when new items are added.
- **Client/server boundary**: page-level files in `app/` stay server components; state, effects, and browser APIs move into a dedicated `Client` component (`CatalogueClient`, `MapClient`, `ThemeToggle`, `Header`). The anti-FOUC script in `app/layout.tsx` is an exception — it ships as raw HTML via `dangerouslySetInnerHTML` so it executes before hydration.
- **Specs and plans are separate**: `/sweetforge.vibe` writes to `_specification/vibe coding/<slug>.md`; Plan mode writes to `C:\Users\olivi\.claude\plans\`. Never put planning artifacts under `_specification/`.

## Slash commands

Custom workflows live in `.claude/commands/`. The two most-used in this repo:
- `/sweetforge.vibe <short idea>` — generate a lightweight feature spec under `_specification/vibe coding/`.
- SpecKit suite (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`, etc.) — the heavier spec-kit flow.

Prefer the slash command over hand-writing spec files so the location and format stay consistent.

## Network calls — ask first

The user requires **explicit confirmation before every HTTP call**, GET included. This applies to `curl` / `wget` from Bash, `WebFetch`, MCP fetch-style tools, and any HTTP request to `atom-synchronizer-dev`, the internet, or any other service. Reading local files (Read/Glob/Grep) does not count. Writes (POST/PUT/PATCH/DELETE) are always forbidden without explicit authorization.

Authorization is per-call: approval for one URL does not extend to related endpoints.
