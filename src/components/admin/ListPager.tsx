import Link from "next/link";
import { ADMIN_PRODUCTS, productListHref, type ListFilters } from "@/lib/admin-list";

/** Prev / numbered pages / Next / go-to-page for a product list. Keeps the search and filters. */
export function ListPager({
  page,
  pageCount,
  filters,
  list = ADMIN_PRODUCTS,
}: {
  page: number;
  pageCount: number;
  filters: ListFilters;
  list?: string;
}) {
  if (pageCount <= 1) return null;
  const pages = new Set([1, pageCount, page - 2, page - 1, page, page + 1, page + 2]);
  const shown = [...pages].filter((n) => n >= 1 && n <= pageCount).sort((a, b) => a - b);
  const link = "rounded-md border border-border bg-white px-3 py-1.5 hover:border-brand hover:text-brand";
  return (
    <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
      {page > 1 && (
        <Link href={productListHref({ ...filters, page: page - 1 }, list)} className={link}>
          ← Prev
        </Link>
      )}
      {shown.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - shown[i - 1] > 1 && <span className="px-1 text-steel-400">…</span>}
          {n === page ? (
            <span aria-current="page" className="rounded-md bg-steel-900 px-3 py-1.5 font-semibold text-white">
              {n}
            </span>
          ) : (
            <Link href={productListHref({ ...filters, page: n }, list)} className={link}>
              {n}
            </Link>
          )}
        </span>
      ))}
      {page < pageCount && (
        <Link href={productListHref({ ...filters, page: page + 1 }, list)} className={link}>
          Next →
        </Link>
      )}
      <form action={list} className="ml-2 flex items-center gap-1">
        {filters.q && <input type="hidden" name="q" value={filters.q} />}
        {filters.cat && <input type="hidden" name="cat" value={filters.cat} />}
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <label className="text-steel-500" htmlFor="goto-page">
          Go to
        </label>
        <input
          id="goto-page"
          name="page"
          type="number"
          min={1}
          max={pageCount}
          defaultValue={page}
          className="w-16 rounded-md border border-border px-2 py-1"
        />
      </form>
    </nav>
  );
}
