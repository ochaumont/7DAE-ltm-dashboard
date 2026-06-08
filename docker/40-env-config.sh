#!/bin/sh
# Generates the browser runtime config (window.__ENV__) at container start, from
# the Basic Auth credentials injected via the Kubernetes secret. Runs as part of
# the stock nginx entrypoint (/docker-entrypoint.d/). No credentials are baked
# into the image — only injected here at runtime, so rotation needs only a pod
# restart, not a rebuild.
set -eu

OUT=/usr/share/nginx/html/env-config.js

if [ -n "${ATOM_API_USERNAME:-}" ] && [ -n "${ATOM_API_PASSWORD:-}" ]; then
  AUTH=$(printf '%s:%s' "$ATOM_API_USERNAME" "$ATOM_API_PASSWORD" | base64 | tr -d '\n')
  printf 'window.__ENV__ = { ATOM_API_AUTHORIZATION: "Basic %s" };\n' "$AUTH" > "$OUT"
  echo "[40-env-config] wrote $OUT with Basic auth header"
else
  printf 'window.__ENV__ = {};\n' > "$OUT"
  echo "[40-env-config] no ATOM_API_USERNAME/PASSWORD set — wrote empty config"
fi
