import Link from "next/link";
import { AskQuestionForm } from "@/components/product/AskQuestionForm";
import { AnswerForm } from "@/components/product/AnswerForm";
import { getQaContext } from "@/lib/qa";

export async function ProductQA({
  productId,
  slug,
}: {
  productId: string;
  slug: string;
}) {
  const { questions, signedIn, canAnswer } = await getQaContext(productId);

  return (
    <section className="mt-14">
      <h2 className="font-display border-b-2 border-steel-900 pb-2 text-2xl font-bold uppercase tracking-wide text-steel-900">
        Questions &amp; Answers
      </h2>

      <div className="mt-6 max-w-2xl">
        {signedIn ? (
          <AskQuestionForm slug={slug} />
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 text-sm text-steel-600">
            <Link href="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>{" "}
            to ask a question about this part.
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="mt-6 text-sm text-steel-500">
          No questions yet — be the first to ask.
        </p>
      ) : (
        <ul className="mt-6 space-y-5">
          {questions.map((q) => (
            <li key={q.id} className="border-b border-border pb-5 last:border-0">
              <p className="font-medium text-steel-900">
                <span className="font-display mr-2 text-brand">Q:</span>
                {q.question}
              </p>
              <p className="mt-0.5 text-xs text-steel-400">
                Asked by {q.authorName} · {q.createdAt.toLocaleDateString()}
              </p>

              {q.answer ? (
                <div className="mt-2 rounded-lg bg-steel-50 p-3">
                  <p className="text-sm text-steel-700">
                    <span className="font-display mr-2 text-steel-900">A:</span>
                    {q.answer}
                  </p>
                  {q.answeredBy && (
                    <p className="mt-0.5 text-xs font-semibold text-success">
                      — {q.answeredBy}
                    </p>
                  )}
                </div>
              ) : canAnswer ? (
                <AnswerForm questionId={q.id} slug={slug} />
              ) : (
                <p className="mt-1 text-xs text-steel-400">Not answered yet.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
