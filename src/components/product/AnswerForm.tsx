"use client";

import { useActionState } from "react";
import { answerQuestionAction, type QaState } from "@/app/actions/qa";

export function AnswerForm({
  questionId,
  slug,
}: {
  questionId: string;
  slug: string;
}) {
  const [state, formAction, pending] = useActionState<QaState, FormData>(
    answerQuestionAction,
    {},
  );

  if (state.ok) return null;

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="answer"
        rows={2}
        placeholder="Answer this question…"
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-1.5 rounded-md bg-steel-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-steel-700 disabled:bg-steel-400"
      >
        {pending ? "Posting…" : "Post Answer"}
      </button>
    </form>
  );
}
