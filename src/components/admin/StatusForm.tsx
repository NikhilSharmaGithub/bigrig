"use client";

import { useActionState } from "react";
import type { AdminState } from "@/app/actions/admin";

export function StatusForm({
  action,
  id,
  current,
  options,
}: {
  action: (prev: AdminState, formData: FormData) => Promise<AdminState>;
  id: string;
  current: string;
  options: readonly string[];
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={current}
        className="rounded-md border border-border bg-white px-2.5 py-1.5 text-sm capitalize text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {options.map((o) => (
          <option key={o} value={o} className="capitalize">
            {o}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-steel-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-steel-700 disabled:bg-steel-400"
      >
        {pending ? "…" : state.ok ? "✓" : "Update"}
      </button>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}
