import Link from "next/link";
import type { Metadata } from "next";
import { requireVendor, getVendorProducts } from "@/lib/vendor";
import { deleteVendorProductAction } from "@/app/actions/vendor";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "My Products" };

export default async function VendorProductsPage() {
  const { vendor } = await requireVendor();
  const items = await getVendorProducts(vendor.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          My Products ({items.length})
        </h1>
        <Link
          href="/vendor/products/new"
          className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          + Add Product
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-steel-500">
          No products yet.{" "}
          <Link href="/vendor/products/new" className="font-semibold text-brand hover:underline">
            Add your first product
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
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
                <tr key={p.id} className="hover:bg-steel-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-steel-900">{p.name}</p>
                    <p className="text-xs text-steel-500">#{p.partNumber}</p>
                  </td>
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
                        href={`/vendor/products/${p.id}`}
                        className="font-semibold text-brand hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteVendorProductAction.bind(null, p.id)}>
                        <button
                          type="submit"
                          className="text-steel-500 hover:text-danger"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
