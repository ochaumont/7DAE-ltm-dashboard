import type { SyntheticEvent } from "react";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_HREF ?? "";

/**
 * Prepends the Next.js basePath to any absolute path that doesn't already
 * include it. Safe to call on paths that already carry the prefix, on http(s)
 * URLs, and when BASE_PATH is empty (no-op).
 */
export function withBasePath(url: string): string {
  if (!BASE_PATH || url.startsWith("http") || url.startsWith(BASE_PATH))
    return url;
  return `${BASE_PATH}${url}`;
}

/**
 * Local SVG fallback used whenever a photo fails to load (404 from the photo
 * proxy, broken upstream, etc). Bundled in `public/`, always available.
 */
export const PHOTO_PLACEHOLDER = `${BASE_PATH}/covers/no-ltm-photo.png`;

/**
 * `onError` handler that swaps a broken `<img>` `src` to the local placeholder.
 *
 * Guards against an infinite error loop if the placeholder itself fails to
 * load (extremely unlikely, but cheap to be safe).
 */
export function placeholderOnError(
  e: SyntheticEvent<HTMLImageElement>,
): void {
  const t = e.currentTarget;
  if (!t.src.endsWith(PHOTO_PLACEHOLDER)) t.src = PHOTO_PLACEHOLDER;
}
