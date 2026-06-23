"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { BrandFacet } from "@/lib/types";

export function FilterSidebar({ brandFacets }: { brandFacets: BrandFacet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const selectedBrands = new Set(
    (params.get("brand") ?? "").split(",").filter(Boolean),
  );
  const inStockOnly = params.get("stock") === "1";

  function push(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggleBrand(slug: string) {
    const next = new URLSearchParams(params.toString());
    const set = new Set(selectedBrands);
    if (set.has(slug)) set.delete(slug);
    else set.add(slug);
    if (set.size) next.set("brand", [...set].join(","));
    else next.delete("brand");
    push(next);
  }

  function toggleStock() {
    const next = new URLSearchParams(params.toString());
    if (inStockOnly) next.delete("stock");
    else next.set("stock", "1");
    push(next);
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());
    next.delete("brand");
    next.delete("stock");
    push(next);
  }

  const hasFilters = selectedBrands.size > 0 || inStockOnly;

  return (
    <aside className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide text-steel-900">
          Filters
        </h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-semibold text-brand hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-steel-700">Availability</h3>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-steel-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={toggleStock}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          In stock only
        </label>
      </div>

      {brandFacets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-steel-700">Brand</h3>
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {brandFacets.map((b) => (
              <li key={b.slug}>
                <label className="flex cursor-pointer items-center justify-between gap-2 text-sm text-steel-700">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedBrands.has(b.slug)}
                      onChange={() => toggleBrand(b.slug)}
                      className="h-4 w-4 accent-[var(--color-brand)]"
                    />
                    {b.name}
                  </span>
                  <span className="text-xs text-steel-400">{b.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
