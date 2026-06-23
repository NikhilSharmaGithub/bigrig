import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { productQuestions, products } from "@/db/schema";
import { getCurrentUser, isUserAdmin, type SessionUser } from "@/lib/auth";
import { getVendorForUser } from "@/lib/vendor";

export async function getProductQuestions(productId: string) {
  return db
    .select()
    .from(productQuestions)
    .where(eq(productQuestions.productId, productId))
    .orderBy(desc(productQuestions.createdAt))
    .limit(50);
}

/** Can this user answer questions for the given product? */
export async function canAnswerFor(
  user: SessionUser | null,
  productId: string,
): Promise<{ allowed: boolean; as: string }> {
  if (!user) return { allowed: false, as: "" };
  if (isUserAdmin(user)) return { allowed: true, as: "Big Rig Components" };
  const vendor = await getVendorForUser(user.id);
  if (vendor) {
    const p = await db.query.products.findFirst({
      where: eq(products.id, productId),
      columns: { vendorId: true },
    });
    if (p?.vendorId === vendor.id) return { allowed: true, as: vendor.storeName };
  }
  return { allowed: false, as: "" };
}

export async function getQaContext(productId: string) {
  const [questions, user] = await Promise.all([
    getProductQuestions(productId),
    getCurrentUser(),
  ]);
  const answer = await canAnswerFor(user, productId);
  return { questions, signedIn: Boolean(user), canAnswer: answer.allowed };
}
