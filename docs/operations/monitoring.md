# Monitoring

## Health endpoint
`app/health/route.ts` serves a static `GET /health` route (`export const dynamic = "force-static"`) returning:
```json
{ "status": "ok" }
```
This is the only health signal the app exposes. The Helm chart's liveness and readiness probes both target this endpoint (see [Deployment](deployment.md)).

## Current gaps
There is no metrics, logging, or tracing endpoint in the codebase today. `/health` only confirms that the nginx container is serving the static bundle — it does not verify connectivity to the `atom-synchronizer-dev` backend or surface any application-level signal. If deeper observability is needed (backend connectivity, client-side error rates), it does not exist yet and would need to be added deliberately rather than assumed present.
