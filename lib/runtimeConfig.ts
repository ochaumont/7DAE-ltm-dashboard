// Runtime configuration read in the browser.
//
// In production the value is injected at container start: the entrypoint writes
// `public/env-config.js` → `window.__ENV__`, loaded by a <script> in the root
// layout before the app bundle. This keeps secrets out of the static build and
// allows rotation without a rebuild.
//
// In development there is no entrypoint, so we fall back to an optional
// NEXT_PUBLIC_* var (set locally in .env.local). When nothing is configured,
// the empty string means "no auth header" — behaviour is unchanged.

declare global {
  interface Window {
    __ENV__?: {
      ATOM_API_AUTHORIZATION?: string;
    };
  }
}

/** Full `Authorization` header value (e.g. "Basic …"), or "" if not configured. */
export function getAtomAuthorization(): string {
  if (typeof window !== "undefined" && window.__ENV__?.ATOM_API_AUTHORIZATION) {
    return window.__ENV__.ATOM_API_AUTHORIZATION;
  }
  return process.env.NEXT_PUBLIC_ATOM_API_AUTHORIZATION ?? "";
}
