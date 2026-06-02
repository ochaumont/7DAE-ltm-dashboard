import type { SyntheticEvent } from "react";

/**
 * Local SVG fallback used whenever a photo fails to load (404 from the photo
 * proxy, broken upstream, etc). Bundled in `public/`, always available.
 */
export const PHOTO_PLACEHOLDER = `${process.env.NEXT_PUBLIC_BASE_HREF ?? ""}/covers/no-ltm-photo.png`;

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
