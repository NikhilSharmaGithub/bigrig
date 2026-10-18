"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { createListAction, type ListResult } from "@/app/actions/lists";

export function CreateListForm() {
  const [state, formAction, pending] = useActionState<ListResult, FormData>(createListAction, {});
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok && input.current) input.current.value = "";
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        ref={input}
        name="name"
        maxLength={40}
        required
        placeholder="New list, e.g. Truck #12 service"
        aria-label="New list name"
        className="w-72 max-w-full rounded-md border border-border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Creating…" : "+ Create list"}
      </button>
      {state.error && <span className="text-sm text-brand">{state.error}</span>}
    </form>
  );
}
