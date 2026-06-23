import Link from "next/link";
import type { Metadata } from "next";
import { getAdminProducts } from "@/lib/admin";
import { toggleProductActiveAction } from "@/app/actions/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Products" };

export default async function AdminProductsPage() {
  const items = await getAdminProducts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          Products ({items.length})
        </h1>
        <div className="flex gap-2">
          <Link
            href="/admin/products/import"
            className="rounded-md border border-border bg-white px-5 py-2.5 font-semibold text-steel-700 hover:border-brand hover:text-brand"
          >
            Bulk Import
          </Link>
          <Link
            href="/admin/products/new"
            className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
          >
            + Add Product
          </Link>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((p) => (
              <tr key={p.id} className="hover:bg-steel-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-steel-900">{p.name}</p>
                  <p className="text-xs text-steel-500">#{p.partNumber}</p>
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
                      href={`/admin/products/${p.id}`}
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
