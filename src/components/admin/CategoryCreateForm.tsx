"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategoryAction, type AdminState } from "@/app/actions/admin";

const ipt =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand";

export function CategoryCreateForm({
  parents,
}: {
  parents: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    createCategoryAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="grid gap-3 sm:grid-cols-2">
      <input name="name" placeholder="Name *" required className={ipt} />
      <input name="slug" placeholder="slug (auto if blank)" className={ipt} />
      <select name="parentId" defaultValue="" className={ipt}>
        <option value="">Top-level (no parent)</option>
        {parents.map((p) => (
          <option key={p.id} value={p.id}>
            Under: {p.name}
          </option>
        ))}
      </select>
      <input name="blurb" placeholder="Short blurb (optional)" className={ipt} />
      <div className="sm:col-span-2">
        {state.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}
        {state.ok && <p className="mb-2 text-sm text-success">Category added.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
        >
          {pending ? "Adding…" : "Add Category"}
        </button>
      </div>
    </form>
  );
}
