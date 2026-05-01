"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // `lib/atom-api.ts` prefixes every backend-down error with `ATOM_BACKEND_DOWN:`
  // (machine-readable). Keep this prefix stable on both sides.
  const isBackendDown = error.message.startsWith("ATOM_BACKEND_DOWN:");

  return (
    <main className="px-4 md:px-6 py-20 max-w-2xl mx-auto text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/15 text-danger mb-6">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-3">
        {isBackendDown
          ? "ATOM API unavailable"
          : "Something went wrong"}
      </h1>
      <p className="text-muted mb-6">
        {isBackendDown
          ? "The backend that serves lab test means is not responding. Start atom-synchronizer-dev on localhost:8080 or contact support."
          : error.message}
      </p>
      {error.digest && (
        <p className="text-xs font-mono text-muted mb-6">
          Error ID: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="px-5 py-2.5 rounded bg-accent text-accent-fg font-semibold hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </main>
  );
}
