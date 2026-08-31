# Usage

The header's navigation gives access to five screens. Every screen reads from the same underlying list of Lab Test Means (LTM), fetched once from `atom-synchronizer-dev`.

## Catalogue (`/`)
The landing page: a paginated grid of bench cards. Each card shows a placeholder cover image, name, code, status, and type. Supports filtering (including a Draft / All / Release "quality seal" filter) and a hierarchical program filter. Filters are preserved when navigating to a bench's detail page and back, but reset when returning explicitly via the "Catalogue" nav item.

## Map (`/map`)
A full-screen MapLibre view plotting every geo-located bench across the four known Airbus sites (Toulouse, Hamburg, Filton, Bremen). Benches without a recognized site are excluded from the map.

## Lab Test Mean detail (`/labtestmean?id=<externalId>`)
The detail page for a single bench: photo gallery, security/access info, lifecycle timeline (with a Draft/Release state badge), assigned people, and related programs/projects.

## Dependency Graph (`/depgraph`)
An interactive node/edge graph (built on `@xyflow/react`, laid out with `elkjs`). Search and select one or more benches as graph centers; each shows its direct relations — benches it depends on, benches that depend on it, and shared resources it uses. From there:
- **Right-click any node** to progressively expand its own dependencies or shared resources, or to hide it — the diagram grows level by level rather than showing everything at once.
- **Solid vs. dashed edges** distinguish mandatory vs. optional coupling between benches.
- **Save / load / export** diagrams locally in the browser, or export a diagram to a file to share with a colleague, who can import it back.
- A **display settings** panel controls which fields show on each card (status, type, city, building/room) and card width.

## Dependency View (`/depview`)
A circular layout showing every bench that matches the active filters, with relationships drawn as curves through the center. Hovering a bench highlights its incoming and outgoing links. A checklist lets you show/hide individual benches from the current filtered set (with search and select-all/none), and a slider controls how many benches are shown at once.

## Health (`/health`)
Not a user-facing screen — a static JSON endpoint (`{"status":"ok"}`) used by deployment health checks. See [Monitoring](../operations/monitoring.md).
