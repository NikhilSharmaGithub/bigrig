import Link from "next/link";
import type { Metadata } from "next";
import {
  ADMIN_PRODUCTS_PER_PAGE,
  getAdminProducts,
  getCategoryFilterOptions,
  getSelectableCategories,
} from "@/lib/admin";
import { productListHref } from "@/lib/admin-list";
import { ListScrollMemory } from "@/components/admin/ListScrollMemory";
import { ListPager } from "@/components/admin/ListPager";
import { deleteProductAction, toggleProductActiveAction } from "@/app/actions/admin";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { BulkCategoryBar, BULK_FORM_ID } from "@/components/admin/BulkCategoryBar";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Products" };

type Props = {
  searchParams: Promise<{ q?: string; cat?: string; status?: string; page?: string }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const cat = sp.cat ?? "";
  const status = sp.status === "active" || sp.status === "hidden" ? sp.status : undefined;
  const [{ items, total, page, pageCount }, categoryOptions, filterCategories] = await Promise.all([
    getAdminProducts({ q, categoryId: cat || undefined, status, page: Number(sp.page) || 1 }),
    getSelectableCategories(),
    getCategoryFilterOptions(),
  ]);
  const filters = { q, cat, status };
  const here = productListHref({ ...filters, page });
  const first = total === 0 ? 0 : (page - 1) * ADMIN_PRODUCTS_PER_PAGE + 1;
  const last = Math.min(total, page * ADMIN_PRODUCTS_PER_PAGE);
  const filtered = Boolean(q || cat || status);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          Products ({total.toLocaleString()})
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/import"
            className="rounded-md border border-border bg-white px-5 py-2.5 font-semibold text-steel-700 hover:border-brand hover:text-brand"
          >
            Bulk Upload / Export
          </Link>
          <Link
            href={`/admin/products/new?back=${encodeURIComponent(here)}`}
            className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <ListScrollMemory />

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
          name="cat"
          defaultValue={cat}
          aria-label="Category"
          className="rounded-md border border-border px-2 py-2 text-sm"
        >
          <option value="">All categories</option>
          {filterCategories.map((parent) => (
            <optgroup key={parent.id} label={parent.name}>
              <option value={parent.id}>All {parent.name}</option>
              {parent.children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
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
        <button type="submit" className="rounded-md bg-steel-900 px-5 py-2 text-sm font-semibold text-white hover:bg-steel-700">
          Search
        </button>
        {filtered && (
          <Link href="/admin/products" className="px-2 py-2 text-sm text-steel-500 hover:text-brand">
            Clear
          </Link>
        )}
      </form>

      <BulkCategoryBar options={categoryOptions} />

      <p className="mt-3 text-sm text-steel-500">
        {total === 0
          ? filtered
            ? "No products match. Try a shorter part number or fewer words."
            : "No products yet."
          : `Showing ${first.toLocaleString()}–${last.toLocaleString()} of ${total.toLocaleString()}${filtered ? " matching" : ""}`}
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="w-10 px-4 py-3">
                <span className="sr-only">Select</span>
              </th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Brand</th>
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
                  <input
                    type="checkbox"
                    name="ids"
                    value={p.id}
                    form={BULK_FORM_ID}
                    aria-label={`Select ${p.name}`}
                    className="h-4 w-4 accent-brand"
                  />
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-steel-900">{p.name}</p>
                  <p className="text-xs text-steel-500">#{p.partNumber}</p>
                </td>
                <td className="px-4 py-3">
                  <CategorySelect
                    productId={p.id}
                    value={p.categoryId}
                    currentName={p.categoryName}
                    options={categoryOptions}
                  />
                </td>
                <td className="px-4 py-3 text-steel-600">{p.brandName ?? "—"}</td>
                <td className="px-4 py-3 font-medium text-steel-900">
                  {formatPrice(p.priceCents)}
                </td>
                <td className="px-4 py-3 text-steel-600">{p.qty ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      p.isActive
                        ? "bg-success/15 text-success"
                        : "bg-steel-200 text-steel-600"
                    }`}
                  >
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/products/${p.id}?back=${encodeURIComponent(here)}`}
                      data-remember-scroll
                      className="font-semibold text-brand hover:underline"
                    >
                      Edit
                    </Link>
                    <form
                      action={toggleProductActiveAction.bind(
                        null,
                        p.id,
                        !p.isActive,
                      )}
                    >
                      <button
                        type="submit"
                        className="text-steel-500 hover:text-steel-900"
                      >
                        {p.isActive ? "Hide" : "Show"}
                      </button>
                    </form>
                    <DeleteProductButton
                      name={p.name}
                      action={deleteProductAction.bind(null, p.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPager page={page} pageCount={pageCount} filters={filters} />
    </div>
  );
}
