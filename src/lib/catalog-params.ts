import type { ListOpts } from "@/lib/queries";
import type { SortKey } from "@/lib/types";

export type RawSearchParams = Record<string, string | string[] | undefined>;

/** Collapse Next's string|string[] search params to a flat string map. */
export function flattenParams(
  sp: RawSearchParams,
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(sp)) {
    out[k] = Array.isArray(v) ? v[0] : v;
  }
  return out;
}

const VALID_SORTS: SortKey[] = [
  "relevance",
  "price-asc",
  "price-desc",
  "rating",
  "newest",
];

export function parseListOpts(
  sp: Record<string, string | undefined>,
  extra?: Partial<ListOpts>,
): ListOpts {
  const sort = VALID_SORTS.includes(sp.sort as SortKey)
    ? (sp.sort as SortKey)
    : undefined;
  return {
    page: Number(sp.page) > 0 ? Number(sp.page) : 1,
    brandSlugs: sp.brand ? sp.brand.split(",").filter(Boolean) : undefined,
    inStockOnly: sp.stock === "1",
    sort,
    q: sp.q,
    ...extra,
  };
}
