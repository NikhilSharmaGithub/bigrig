import { safeNextPath } from "@/lib/next-path";

/** Product lists that keep their page/search when you edit a product and come back. */
export const ADMIN_PRODUCTS = "/admin/products";
export const VENDOR_PRODUCTS = "/vendor/products";

/**
 * Where to go after saving a product: the list page the user came from (same
 * search, filters and page), never anywhere outside that list.
 */
export function productListReturnPath(value: unknown, list: string = ADMIN_PRODUCTS): string {
  const path = safeNextPath(value);
  if (!path) return list;
  const bare = path.split(/[?#]/)[0];
  return bare === list ? path.split("#")[0] : list;
}

/** The list URL with the edited row as the anchor, so the browser lands on it. */
export function productListReturnUrl(value: unknown, productId?: string, list: string = ADMIN_PRODUCTS): string {
  const base = productListReturnPath(value, list);
  return productId ? `${base}#p-${productId}` : base;
}

export type ListFilters = { q?: string; cat?: string; status?: string };

export function productListHref(params: ListFilters & { page?: number }, list: string = ADMIN_PRODUCTS): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.cat) sp.set("cat", params.cat);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `${list}?${qs}` : list;
}
