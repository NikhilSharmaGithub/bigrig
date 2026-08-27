"use client";

import { useEffect } from "react";

// Branded runtime-error boundary. Replaces Next.js's raw "server error" page
// so a transient DB/backend hiccup never shows an unstyled crash screen.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for server logs / observability.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-brand/10 text-brand">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-display mt-6 text-2xl font-bold text-steel-900">
        Something went wrong
      </h1>
      <p className="mt-2 text-steel-500">
        We hit a snag loading this page. This is usually temporary — please try
        again in a moment.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-border px-6 py-3 font-semibold text-steel-700 transition-colors hover:border-brand hover:text-brand"
        >
          Back to home
        </a>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-steel-400">Reference: {error.digest}</p>
      )}
    </div>
  );
}
