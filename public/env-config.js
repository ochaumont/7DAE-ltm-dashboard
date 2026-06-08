// Default no-op runtime config. In production the container entrypoint
// (docker/40-env-config.sh) overwrites this file with the real values from the
// Kubernetes secret. NEVER put credentials here — this file is committed.
window.__ENV__ = window.__ENV__ || {};
