"use client";

import { startTransition, useActionState } from "react";
import type { QuoteFormState } from "@/app/actions/quotes";

/** Code box shared by the shopper lookup (/quote) and the admin lookup. */
export function QuoteLookupForm({
  action,
  label = "Find quote",
}: {
  action: (prev: QuoteFormState, data: FormData) => Promise<QuoteFormState>;
  label?: string;
}) {
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="flex flex-wrap items-start gap-2"
    >
      <input
        name="code"
        required
        placeholder="Q-XXXXXX"
        aria-label="Quote code"
        autoCapitalize="characters"
        className="w-44 rounded-md border border-border px-3 py-2 font-mono text-sm uppercase tracking-wider"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Looking…" : label}
      </button>
      {state.error && <p className="w-full text-sm text-brand">{state.error}</p>}
    </form>
  );
}
