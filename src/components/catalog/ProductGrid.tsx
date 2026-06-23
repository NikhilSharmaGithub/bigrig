import { ProductCard } from "@/components/product/ProductCard";
import type { ProductCardItem } from "@/lib/types";

export function ProductGrid({ items }: { items: ProductCardItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center">
        <p className="font-display text-lg font-bold text-steel-700">
          No parts found
        </p>
        <p className="mt-1 text-sm text-steel-500">
          Try removing a filter or searching a different term.
        </p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}
