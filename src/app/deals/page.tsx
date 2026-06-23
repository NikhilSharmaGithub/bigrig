import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { getDeals } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Deals",
  description: "Save on heavy-duty truck and trailer parts. Top markdowns, while stock lasts.",
};

export default async function DealsPage() {
  const deals = await getDeals();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Deals" }]} />
      <div className="mt-4 border-b-2 border-steel-900 pb-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          Deals
        </h1>
        <p className="mt-1 text-steel-500">
          Marked-down parts from the brands you trust — while stock lasts.
        </p>
      </div>

      <div className="mt-6">
        <ProductGrid items={deals} />
      </div>
    </div>
  );
}
