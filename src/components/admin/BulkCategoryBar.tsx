"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { bulkSetCategoryAction, type AdminState } from "@/app/actions/admin";

export const BULK_FORM_ID = "bulk-category";

const checkboxes = () =>
  Array.from(
    document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${BULK_FORM_ID}"]`),
  );

/**
 * "Move selected to <category>". The row checkboxes live in the table and join
 * this form through their form="bulk-category" attribute.
 */
export function BulkCategoryBar({ options }: { options: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    bulkSetCategoryAction,
    {},
  );
  const [selected, setSelected] = useState(0);
  const [total, setTotal] = useState(0);

  // Counts follow the row checkboxes' change events (they bubble to document).
  useEffect(() => {
    const update = () => {
      const all = checkboxes();
      setTotal(all.length);
      setSelected(all.filter((c) => c.checked).length);
    };
    document.addEventListener("change", update);
    return () => document.removeEventListener("change", update);
  }, []);

  // After a successful move, clear the checked rows (and let the listener recount).
  useEffect(() => {
    if (!state.ok) return;
    checkboxes().forEach((c) => (c.checked = false));
    document.dispatchEvent(new Event("change"));
  }, [state]);

  return (
    <form
      id={BULK_FORM_ID}
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm"
    >
      <label className="flex items-center gap-2 font-medium text-steel-700">
        <input
          type="checkbox"
          checked={selected > 0 && selected === total}
          onChange={(e) => checkboxes().forEach((c) => (c.checked = e.target.checked))}
          className="h-4 w-4 accent-brand"
        />
        Select all
      </label>
      <span className="text-steel-500">{selected} selected</span>
      <span className="text-steel-400">→</span>
      <select
        name="categoryId"
        defaultValue=""
        aria-label="Move to category"
        className="rounded-md border border-border bg-white px-2 py-1.5 text-sm"
      >
        <option value="">Move to category…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending || selected === 0}
        className="rounded-md bg-steel-900 px-4 py-1.5 font-semibold text-white hover:bg-brand disabled:cursor-not-allowed disabled:bg-steel-300"
      >
        {pending ? "Moving…" : "Move"}
      </button>
      {state.error && <span className="text-brand">{state.error}</span>}
      {state.message && <span className="text-success">{state.message}</span>}
    </form>
  );
}
