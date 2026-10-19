import Link from "next/link";
import type { Metadata } from "next";
import { requireVendor, getVendorProducts } from "@/lib/vendor";
import { deleteVendorProductAction } from "@/app/actions/vendor";
import { formatPrice } from "@/lib/format";
import { PRODUCTS_PER_PAGE } from "@/lib/product-search";
import { VENDOR_PRODUCTS, productListHref } from "@/lib/admin-list";
import { ListPager } from "@/components/admin/ListPager";
import { ListScrollMemory } from "@/components/admin/ListScrollMemory";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export const metadata: Metadata = { title: "My Products" };

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
};

export default async function VendorProductsPage({ searchParams }: Props) {
  const { vendor } = await requireVendor();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status === "active" || sp.status === "hidden" ? sp.status : undefined;
  const { items, total, page, pageCount } = await getVendorProducts(vendor.id, {
    q,
    status,
    page: Number(sp.page) || 1,
  });
  const filters = { q, status };
  const filtered = Boolean(q || status);
  const here = productListHref({ ...filters, page }, VENDOR_PRODUCTS);
  const first = total === 0 ? 0 : (page - 1) * PRODUCTS_PER_PAGE + 1;
  const last = Math.min(total, page * PRODUCTS_PER_PAGE);

  return (
    <div>
      <ListScrollMemory />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          My Products ({total.toLocaleString()})
        </h1>
        <div className="flex flex-wrap gap-2 whitespace-nowrap">
          <Link
            href="/vendor/products/import"
            className="rounded-md border border-border bg-white px-5 py-2.5 font-semibold text-steel-700 hover:border-brand hover:text-brand"
          >
            Bulk Upload / Export
          </Link>
          <Link
            href={`/vendor/products/new?back=${encodeURIComponent(here)}`}
            className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {total === 0 && !filtered ? (
        <p className="mt-6 text-steel-500">
          No products yet.{" "}
          <Link href="/vendor/products/new" className="font-semibold text-brand hover:underline">
            Add your first product
          </Link>
          .
        </p>
      ) : (
        <>
          <form role="search" className="mt-5 flex flex-wrap items-end gap-2 rounded-lg border border-border bg-white p-3">
            <label className="min-w-64 flex-1">
              <span className="sr-only">Search</span>
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Search by part number, name or description…"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
            <select
              name="status"
              defaultValue={status ?? ""}
              aria-label="Status"
              className="rounded-md border border-border px-2 py-2 text-sm"
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-steel-900 px-5 py-2 text-sm font-semibold text-white hover:bg-steel-700"
            >
              Search
            </button>
            {filtered && (
              <Link href={VENDOR_PRODUCTS} className="px-2 py-2 text-sm text-steel-500 hover:text-brand">
                Clear
              </Link>
            )}
          </form>

          <p className="mt-3 text-sm text-steel-500">
            {total === 0
              ? "No products match. Try a shorter part number or fewer words."
              : `Showing ${first.toLocaleString()}–${last.toLocaleString()} of ${total.toLocaleString()}${filtered ? " matching" : ""}`}
          </p>

          {items.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((p) => (
                    <tr
                      key={p.id}
                      id={`p-${p.id}`}
                      className="scroll-mt-24 transition-colors duration-700 hover:bg-steel-50 data-flash:bg-accent/20"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-steel-900">{p.name}</p>
                        <p className="text-xs text-steel-500">#{p.partNumber}</p>
                      </td>
                      <td className="px-4 py-3 font-medium text-steel-900">{formatPrice(p.priceCents)}</td>
                      <td className="px-4 py-3 text-steel-600">{p.qty ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.isActive ? "bg-success/15 text-success" : "bg-steel-200 text-steel-600"
                          }`}
                        >
                          {p.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/vendor/products/${p.id}?back=${encodeURIComponent(here)}`}
                            data-remember-scroll
                            className="font-semibold text-brand hover:underline"
                          >
                            Edit
                          </Link>
                          <DeleteProductButton name={p.name} action={deleteVendorProductAction.bind(null, p.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <ListPager page={page} pageCount={pageCount} filters={filters} list={VENDOR_PRODUCTS} />
        </>
      )}
    </div>
  );
}
