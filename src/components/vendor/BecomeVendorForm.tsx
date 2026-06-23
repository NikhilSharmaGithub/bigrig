"use client";

import { useActionState } from "react";
import { createVendorAction, type VendorState } from "@/app/actions/vendor";

export function BecomeVendorForm() {
  const [state, formAction, pending] = useActionState<VendorState, FormData>(
    createVendorAction,
    {},
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-border bg-white p-6"
    >
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-steel-700">
          Store name *
        </span>
        <input
          name="storeName"
          required
          placeholder="e.g. Lone Star Diesel Supply"
          className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-steel-700">
          About your store
        </span>
        <textarea
          name="bio"
          rows={3}
          placeholder="What do you sell? Tell buyers about your shop."
          className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Creating store…" : "Open My Store"}
      </button>
    </form>
  );
}
