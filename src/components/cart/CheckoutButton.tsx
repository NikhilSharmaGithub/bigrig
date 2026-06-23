"use client";

import { useState } from "react";

export function CheckoutButton({ disabled }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Checkout is unavailable right now.");
        setLoading(false);
        return;
      }
      window.location.href = data.url as string;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={checkout}
        disabled={disabled || loading}
        className="w-full rounded-md bg-brand px-6 py-3.5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-steel-400"
      >
        {loading ? "Redirecting…" : "Proceed to Checkout"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
