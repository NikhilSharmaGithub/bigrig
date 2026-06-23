import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { getTopCategories } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Shop All Categories",
  description: "Browse heavy-duty truck and trailer parts by category.",
};

export default async function CategoriesIndexPage() {
  const cats = await getTopCategories();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Categories" }]} />
      <div className="mt-4 border-b-2 border-steel-900 pb-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          Shop All Categories
        </h1>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((cat) => (
          <div
            key={cat.id}
            className="rounded-lg border border-border bg-white p-5"
          >
            <Link
              href={`/c/${cat.slug}`}
              className="font-display text-lg font-bold text-steel-900 hover:text-brand"
            >
              {cat.name}
            </Link>
            {cat.blurb && (
              <p className="mt-0.5 text-xs text-steel-500">{cat.blurb}</p>
            )}
            <ul className="mt-3 space-y-1.5">
              {cat.children.map((sub) => (
                <li key={sub.id}>
                  <Link
                    href={`/c/${cat.slug}/${sub.slug}`}
                    className="text-sm text-steel-600 hover:text-brand"
                  >
                    {sub.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
