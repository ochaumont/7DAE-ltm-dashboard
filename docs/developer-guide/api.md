# API

## Backend
The dashboard is a read-only client of **`atom-synchronizer-dev`**, a Spring Boot service. Its `LabTestMean` entity is the single source of truth for everything the dashboard displays. The service also exposes Springdoc OpenAPI documentation at `/v3/api-docs` (roughly 42 endpoints in total, spanning sync processes, ATOM reads, KPIs, and connectivity healthchecks to LeanIX / Alfabet / ADAM / Google) — the dashboard only consumes a small slice of that surface.

## Endpoints consumed
- `GET {NEXT_PUBLIC_ATOM_API_BASE_URL}/api/infos/labtestmeans` — the full list, used by the catalogue, map, and dependency screens.
- `GET {NEXT_PUBLIC_ATOM_API_BASE_URL}/api/infos/labtestmeans/{externalId}` — a single bench, used by the detail page.

Both are fetched from `lib/atom-api.ts`, which throws `AtomApiError` (with `status: 0` on a network failure) on any failure; `app/error.tsx` matches on that error to render a backend-down screen instead of a generic crash.

## Relations and coupling
Each `LabTestMean` DTO carries three typed relation lists, mapped by `lib/labtestmean-adapter.ts` into the dependency graph/view models:
- `LTMDependsOn` — benches the selected bench depends on.
- `LTMSupports` — benches that depend on the selected bench (the inverse relation).
- `SharedResourcesDependsOn` — shared resources the bench uses.

Each relation carries a **coupling** attribute (`mandatory` / `optional`), rendered as a solid edge for mandatory dependencies and a dashed edge for optional ones in the Dependency Graph view.

## Error handling contract
- Network failure → `AtomApiError` with `status: 0`.
- Any other non-2xx response → `AtomApiError` with the corresponding HTTP status.
- Consumers should not assume a partial/successful response shape on error — treat any thrown `AtomApiError` as "no data available."
