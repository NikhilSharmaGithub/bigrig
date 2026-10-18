"use client";

import { useState } from "react";

/** Starts Stripe Checkout at the quoted prices. */
export function AcceptQuoteButton({ code }: { code: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const res = await fetch("/api/quote-checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code }),
            });
            const data = (await res.json()) as { url?: string; error?: string };
            if (data.url) {
              window.location.href = data.url;
              return;
            }
            setError(data.error ?? "Checkout couldn't start. Please try again.");
          } catch {
            setError("Checkout couldn't start. Please try again.");
          }
          setPending(false);
        }}
        className="w-full rounded-md bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Starting checkout…" : "Accept quote & check out"}
      </button>
      {error && <p className="mt-2 text-sm text-brand">{error}</p>}
    </div>
  );
}
