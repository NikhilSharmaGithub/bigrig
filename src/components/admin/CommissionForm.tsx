"use client";

import { useActionState } from "react";
import { setCommissionAction, type AdminState } from "@/app/actions/admin";

export function CommissionForm({ currentPercent }: { currentPercent: number }) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    setCommissionAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-steel-600">
          Platform commission (%)
        </span>
        <input
          name="commissionPercent"
          type="number"
          step="0.5"
          min="0"
          max="50"
          defaultValue={currentPercent}
          className="w-32 rounded-md border border-border bg-white px-3 py-2 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-steel-900 px-4 py-2 text-sm font-semibold text-white hover:bg-steel-700 disabled:bg-steel-400"
      >
        {pending ? "Saving…" : state.ok ? "✓ Saved" : "Save"}
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
