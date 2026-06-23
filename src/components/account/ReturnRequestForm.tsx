"use client";

import { useActionState } from "react";
import { requestReturnAction, type FormState } from "@/app/actions/account";

export function ReturnRequestForm({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    requestReturnAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="rounded-lg border border-border bg-white p-5"
    >
      <h2 className="font-display text-lg font-bold uppercase text-steel-900">
        Request a Return
      </h2>
      <input type="hidden" name="orderId" value={orderId} />
      <label className="mt-3 block">
        <span className="mb-1 block text-sm font-medium text-steel-700">
          Reason for return
        </span>
        <textarea
          name="reason"
          rows={3}
          placeholder="Wrong part, defective, no longer needed…"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Submitting…" : "Submit Return Request"}
      </button>
    </form>
  );
}
