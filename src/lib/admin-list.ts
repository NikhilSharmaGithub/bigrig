import { safeNextPath } from "@/lib/next-path";

const LIST_PATH = "/admin/products";

/**
 * Where to go after saving a product: the list page the admin came from (same
 * search, filters and page), never anywhere outside the product list.
 */
export function productListReturnPath(value: unknown): string {
  const path = safeNextPath(value);
  if (!path) return LIST_PATH;
  const bare = path.split(/[?#]/)[0];
  return bare === LIST_PATH ? path.split("#")[0] : LIST_PATH;
}

/** The list URL with the edited row as the anchor, so the browser lands on it. */
export function productListReturnUrl(value: unknown, productId?: string): string {
  const base = productListReturnPath(value);
  return productId ? `${base}#p-${productId}` : base;
}

export function productListHref(params: {
  q?: string;
  cat?: string;
  status?: string;
  page?: number;
}): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.cat) sp.set("cat", params.cat);
  if (params.status) sp.set("status", params.status);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  const qs = sp.toString();
  return qs ? `${LIST_PATH}?${qs}` : LIST_PATH;
}
