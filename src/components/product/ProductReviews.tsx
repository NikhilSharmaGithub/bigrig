import Link from "next/link";
import { ReviewForm } from "@/components/product/ReviewForm";
import { getCurrentUser } from "@/lib/auth";
import { getProductReviews, getReviewSummary } from "@/lib/reviews";

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-accent" aria-label={`${value} out of 5`}>
      {"★★★★★".slice(0, full)}
      <span className="text-steel-300">{"★★★★★".slice(full)}</span>
    </span>
  );
}

export async function ProductReviews({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const [summary, reviews, user] = await Promise.all([
    getReviewSummary(productId),
    getProductReviews(productId),
    getCurrentUser(),
  ]);

  return (
    <section className="mt-14">
      <h2 className="font-display border-b-2 border-steel-900 pb-2 text-2xl font-bold uppercase tracking-wide text-steel-900">
        Ratings &amp; Reviews
      </h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Summary + write */}
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-white p-5 text-center">
            <p className="font-display text-5xl font-bold text-steel-900">
              {summary.count > 0 ? summary.avg.toFixed(1) : "—"}
            </p>
            <div className="mt-1 text-lg">
              <Stars value={summary.avg} />
            </div>
            <p className="mt-1 text-sm text-steel-500">
              {summary.count} review{summary.count === 1 ? "" : "s"}
            </p>

            <div className="mt-4 space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = summary.breakdown[star as 1 | 2 | 3 | 4 | 5];
                const pct = summary.count > 0 ? Math.round((n / summary.count) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs text-steel-500">
                    <span className="w-6 text-right">{star}★</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-steel-100">
                      <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-7 text-right">{n}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {user ? (
            <ReviewForm slug={slug} />
          ) : (
            <div className="rounded-lg border border-border bg-surface p-5 text-center text-sm text-steel-600">
              <Link href="/login" className="font-semibold text-brand hover:underline">
                Sign in
              </Link>{" "}
              to write a review.
            </div>
          )}
        </div>

        {/* Review list */}
        <div>
          {reviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface p-10 text-center">
              <p className="font-display text-lg font-bold text-steel-700">
                No reviews yet
              </p>
              <p className="mt-1 text-sm text-steel-500">
                Be the first to review this part.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {reviews.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} />
                      {r.title && (
                        <span className="font-medium text-steel-900">{r.title}</span>
                      )}
                    </div>
                    <span className="text-xs text-steel-400">
                      {r.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-steel-500">
                    {r.authorName}
                    {r.verifiedPurchase && (
                      <span className="ml-2 font-semibold text-success">
                        ✓ Verified Purchase
                      </span>
                    )}
                  </p>
                  {r.body && <p className="mt-2 text-sm text-steel-700">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
