"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productQuestions, products } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canAnswerFor } from "@/lib/qa";

export type QaState = { error?: string; ok?: boolean };

export async function askQuestionAction(
  _prev: QaState,
  formData: FormData,
): Promise<QaState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to ask a question." };

  const slug = String(formData.get("slug") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  if (!question) return { error: "Type your question first." };

  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
  });
  if (!product) return { error: "Product not found." };

  await db.insert(productQuestions).values({
    productId: product.id,
    userId: user.id,
    authorName: user.name || user.email.split("@")[0],
    question,
  });
  revalidatePath(`/p/${slug}`);
  return { ok: true };
}

export async function answerQuestionAction(
  _prev: QaState,
  formData: FormData,
): Promise<QaState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authorized." };

  const questionId = String(formData.get("questionId") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  if (!answer) return { error: "Type an answer." };

  const q = await db.query.productQuestions.findFirst({
    where: eq(productQuestions.id, questionId),
    columns: { id: true, productId: true },
  });
  if (!q) return { error: "Question not found." };

  const { allowed, as } = await canAnswerFor(user, q.productId);
  if (!allowed) return { error: "Not authorized to answer." };

  await db
    .update(productQuestions)
    .set({ answer, answeredBy: as, answeredAt: new Date() })
    .where(eq(productQuestions.id, questionId));
  if (slug) revalidatePath(`/p/${slug}`);
  return { ok: true };
}
