import type { Metadata } from "next";
import { BrandCreateForm } from "@/components/admin/BrandCreateForm";
import { deleteBrandAction } from "@/app/actions/admin";
import { getAllBrands } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin · Brands" };

export default async function AdminBrandsPage() {
  const brands = await getAllBrands();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Brands ({brands.length})
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-steel-700">
          Add a brand
        </h2>
        <div className="mt-3">
          <BrandCreateForm />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-steel-50">
                <td className="px-4 py-3 font-medium text-steel-900">{b.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-steel-500">{b.slug}</td>
                <td className="max-w-md px-4 py-3 text-steel-600">{b.description ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteBrandAction.bind(null, b.id)}>
                    <button type="submit" className="text-sm text-steel-500 hover:text-danger">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
