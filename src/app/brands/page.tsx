import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { getAllBrands } from "@/lib/queries";

export const metadata: Metadata = {
  title: "All Brands",
  description: "Shop heavy-duty truck parts from the brands fleets trust.",
};

export default async function BrandsPage() {
  const brands = await getAllBrands();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Brands" }]} />
      <div className="mt-4 border-b-2 border-steel-900 pb-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          Shop by Brand
        </h1>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <Link
            key={b.id}
            href={`/brands/${b.slug}`}
            className="flex flex-col rounded-lg border border-border bg-white p-5 transition-all hover:border-brand hover:shadow-md"
          >
            <span className="font-display text-xl font-bold text-steel-900">
              {b.name}
            </span>
            {b.description && (
              <span className="mt-1 line-clamp-2 text-xs text-steel-500">
                {b.description}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
