"use client";

import { useEffect, useState } from "react";
import { NEXT_PUBLIC_ATOM_API_BASE_URL } from "@/lib/atom-api";
import { PHOTO_PLACEHOLDER } from "@/lib/photo";

/**
 * Fetches a photo binary from the ATOM backend via CORS and returns a blob URL.
 * Falls back to PHOTO_PLACEHOLDER while loading or on error.
 * Revokes the blob URL on unmount to prevent memory leaks.
 */
export function usePhoto(resourceId: string, resourceUri: string): string {
  const [src, setSrc] = useState(PHOTO_PLACEHOLDER);

  useEffect(() => {
    if (!resourceId || !resourceUri) return;
    let blobUrl: string | null = null;
    const ctrl = new AbortController();

    fetch(`${NEXT_PUBLIC_ATOM_API_BASE_URL}/api/infos/resource`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: resourceId, uri: resourceUri }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => {
        if (blob) {
          blobUrl = URL.createObjectURL(blob);
          setSrc(blobUrl);
        }
      })
      .catch(() => null);

    return () => {
      ctrl.abort();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [resourceId, resourceUri]);

  return src;
}
