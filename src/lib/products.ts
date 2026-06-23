import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { productImages } from "@/db/schema";

/** Parse a textarea of image URLs (newline or comma separated). */
export function parseImageUrls(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, 8);
}

/** Replace all images for a product with the given ordered list of URLs. */
export async function replaceProductImages(
  productId: string,
  urls: string[],
): Promise<void> {
  await db.delete(productImages).where(eq(productImages.productId, productId));
  if (urls.length > 0) {
    await db.insert(productImages).values(
      urls.map((url, i) => ({ productId, url, position: i })),
    );
  }
}
