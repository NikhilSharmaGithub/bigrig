"use client";

import { useActionState, useState } from "react";
import { submitReviewAction, type ReviewState } from "@/app/actions/reviews";

export function ReviewForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    submitReviewAction,
    {},
  );
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.ok) {
    return (
      <div className="rounded-lg border border-success/40 bg-success/10 p-5 text-center">
        <p className="font-display text-lg font-bold text-steel-900">
          Thanks for your review!
        </p>
        <p className="mt-1 text-sm text-steel-600">
          It helps other drivers choose the right part.
        </p>
      </div>
    );
  }

  const shown = hover || rating;

  return (
    <form action={formAction} className="rounded-lg border border-border bg-white p-5">
      <h3 className="font-display font-bold uppercase text-steel-900">Write a review</h3>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="rating" value={rating} />

      <div className="mt-3 flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={`text-3xl leading-none ${n <= shown ? "text-accent" : "text-steel-300"}`}
          >
            ★
          </button>
        ))}
      </div>

      <input
        name="title"
        placeholder="Add a headline (optional)"
        className="mt-3 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <textarea
        name="body"
        rows={3}
        placeholder="What did you think? How did it fit?"
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
      />

      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || rating === 0}
        className="mt-3 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
