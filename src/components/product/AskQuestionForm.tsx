"use client";

import { useActionState } from "react";
import { askQuestionAction, type QaState } from "@/app/actions/qa";

export function AskQuestionForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<QaState, FormData>(
    askQuestionAction,
    {},
  );

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-steel-700">
        Question submitted! We&apos;ll get it answered soon.
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="question"
        rows={2}
        placeholder="Ask about fitment, specs, shipping…"
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {state.error && <p className="mt-1 text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Posting…" : "Ask Question"}
      </button>
    </form>
  );
}
