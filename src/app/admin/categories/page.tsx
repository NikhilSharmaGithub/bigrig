import type { Metadata } from "next";
import { CategoryCreateForm } from "@/components/admin/CategoryCreateForm";
import { deleteCategoryAction } from "@/app/actions/admin";
import { getAdminCategories } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin · Categories" };

export default async function AdminCategoriesPage() {
  const cats = await getAdminCategories();
  const parents = cats.filter((c) => !c.parentId);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Categories ({cats.length})
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-steel-700">
          Add a category
        </h2>
        <div className="mt-3">
          <CategoryCreateForm parents={parents.map((p) => ({ id: p.id, name: p.name }))} />
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Parent</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cats.map((c) => (
              <tr key={c.id} className="hover:bg-steel-50">
                <td className="px-4 py-3 font-medium text-steel-900">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-steel-500">{c.slug}</td>
                <td className="px-4 py-3 text-steel-600">{c.parentName ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteCategoryAction.bind(null, c.id)}>
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
