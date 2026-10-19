import "server-only";
import { ilike, or, sql, type SQL } from "drizzle-orm";
import { products } from "@/db/schema";

export const PRODUCTS_PER_PAGE = 50;

/** "ab-12 34" → "AB1234": part numbers are matched ignoring spaces, dashes and dots. */
function partKey(s: string): string {
  return s.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

const partNumberKey = sql`regexp_replace(upper(${products.partNumber}), '[^0-9A-Z]', '', 'g')`;

/** Matches part number (also with spaces/dashes ignored), name or description. */
export function productSearchWhere(rawQuery: string): SQL | undefined {
  const q = rawQuery.trim().slice(0, 100);
  if (!q) return undefined;
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const key = partKey(q);
  return or(
    ilike(products.partNumber, like),
    ilike(products.name, like),
    ilike(products.description, like),
    ...(key ? [sql`${partNumberKey} LIKE ${`%${key}%`}`] : []),
  );
}

/** Sort key that puts an exact part-number hit first. */
export function exactPartFirst(rawQuery: string): SQL[] {
  const key = partKey(rawQuery.trim().slice(0, 100));
  return key ? [sql`(${partNumberKey} = ${key}) DESC`] : [];
}

/** Clamps a requested page to the pages that exist. */
export function pageWindow(total: number, requested: number | undefined) {
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const page = Math.min(Math.max(1, Math.floor(requested || 1)), pageCount);
  return { page, pageCount, offset: (page - 1) * PRODUCTS_PER_PAGE };
}
