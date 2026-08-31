# LTM Dashboard Documentation

The LTM Dashboard is a Next.js 16 / React 19 web application that visualizes Airbus **Lab Test Means** (LTM) — physical test benches, their locations, lifecycle state, and their dependencies on each other. It is a read-only client for the `atom-synchronizer-dev` backend API, deployed as a static site behind nginx.

## User Guide
- [Installation](user-guide/installation.md) — prerequisites, `npm install`, running the app.
- [Configuration](user-guide/configuration.md) — environment variables, theme, ports.
- [Usage](user-guide/usage.md) — a tour of every screen: catalogue, map, bench detail, dependency graph, dependency view.

## Developer Guide
- [Architecture](developer-guide/architecture.md) — theming model, server/client split, data flow.
- [Local Development](developer-guide/local-development.md) — day-to-day dev workflow and known gotchas.
- [API](developer-guide/api.md) — the backend contract this app consumes.

## Operations
- [Deployment](operations/deployment.md) — Docker image, Helm chart, Jenkins pipeline.
- [Monitoring](operations/monitoring.md) — health checks and current observability gaps.

## Releases
- [v1.0.0](releases/v1.0.0.md) — baseline (catalogue, map, detail, PDF export).
- [v1.1.0](releases/v1.1.0.md) — dependency graph, dependency view, quality-seal filtering, PDF redesign, photo caching.
