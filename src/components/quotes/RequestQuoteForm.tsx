"use client";

import { startTransition, useActionState, useState } from "react";
import { requestQuoteAction, type QuoteFormState } from "@/app/actions/quotes";

/** Cart → "get a better price": turns the cart into a quote code the store prices. */
export function RequestQuoteForm({ email, name }: { email?: string | null; name?: string | null }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(requestQuoteAction, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border-2 border-steel-900 px-4 py-2.5 text-sm font-bold text-steel-900 hover:border-brand hover:text-brand"
      >
        Buying in bulk? Request a quote
      </button>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-2 rounded-md border border-border bg-white p-3"
    >
      <p className="text-sm font-semibold text-steel-900">Request a quote for this cart</p>
      <p className="text-xs text-steel-500">
        You&apos;ll get a quote code. We&apos;ll price your cart and email you, then you can check out at that price.
      </p>
      <input
        name="name"
        defaultValue={name ?? ""}
        placeholder="Name or company"
        aria-label="Name or company"
        className="w-full rounded border border-border px-2.5 py-2 text-sm"
      />
      <input
        name="email"
        type="email"
        required
        defaultValue={email ?? ""}
        placeholder="Email for the price"
        aria-label="Email"
        className="w-full rounded border border-border px-2.5 py-2 text-sm"
      />
      <textarea
        name="note"
        rows={2}
        maxLength={1000}
        placeholder="Anything we should know? e.g. fleet size, delivery date"
        aria-label="Note"
        className="w-full rounded border border-border px-2.5 py-2 text-sm"
      />
      {state.error && <p className="text-sm text-brand">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-steel-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand disabled:bg-steel-400"
      >
        {pending ? "Creating your quote…" : "Get my quote code"}
      </button>
    </form>
  );
}
