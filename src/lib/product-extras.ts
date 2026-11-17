import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productCrossReferences, productSpecs } from "@/db/schema";

export type Pair = { a: string; b: string };

/**
 * Parse the JSON the PairsEditor submits: [{a, b}, ...]. Rows missing the
 * required side are dropped; text is trimmed and length-capped.
 */
export function parsePairs(raw: string, opts: { requireA: boolean }): Pair[] {
  let data: unknown;
  try {
    data = JSON.parse(raw || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: Pair[] = [];
  for (const row of data.slice(0, 100)) {
    const a = String((row as Pair)?.a ?? "").trim().slice(0, 200);
    const b = String((row as Pair)?.b ?? "").trim().slice(0, 1000);
    if (!b) continue;
    if (opts.requireA && !a) continue;
    out.push({ a, b });
  }
  return out;
}

/** Replace a product's specification rows (name → value). */
export async function replaceProductSpecs(productId: string, pairs: Pair[]) {
  await db.delete(productSpecs).where(eq(productSpecs.productId, productId));
  if (pairs.length > 0) {
    await db.insert(productSpecs).values(
      pairs.map((p, i) => ({ productId, name: p.a, value: p.b, position: i })),
    );
  }
}

/** Replace a product's cross-reference rows (brand → part numbers). */
export async function replaceProductCrossRefs(productId: string, pairs: Pair[]) {
  await db
    .delete(productCrossReferences)
    .where(eq(productCrossReferences.productId, productId));
  if (pairs.length > 0) {
    await db.insert(productCrossReferences).values(
      pairs.map((p, i) => ({
        productId,
        brand: p.a || null,
        partNumbers: p.b,
        position: i,
      })),
    );
  }
}
