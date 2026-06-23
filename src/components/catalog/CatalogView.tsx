import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/catalog/Breadcrumbs";
import { FilterSidebar } from "@/components/catalog/FilterSidebar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { Pagination } from "@/components/catalog/Pagination";
import type { ProductListResult } from "@/lib/types";

export function CatalogView({
  title,
  description,
  breadcrumbs,
  result,
  searchParams,
  basePath,
  subnav,
}: {
  title: string;
  description?: string;
  breadcrumbs: Crumb[];
  result: ProductListResult;
  searchParams: Record<string, string | undefined>;
  basePath: string;
  subnav?: ReactNode;
}) {
  const { items, total, page, pageSize, brandFacets } = result;
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-4 border-b-2 border-steel-900 pb-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          {title}
        </h1>
        {description && <p className="mt-1 text-steel-500">{description}</p>}
      </div>

      {subnav}

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden lg:block">
          <FilterSidebar brandFacets={brandFacets} />
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-steel-500">
              {total > 0 ? (
                <>
                  Showing <span className="font-semibold text-steel-700">{start}–{end}</span> of{" "}
                  <span className="font-semibold text-steel-700">{total}</span> parts
                </>
              ) : (
                "0 parts"
              )}
            </p>
            <SortSelect />
          </div>

          <div className="mt-4">
            <ProductGrid items={items} />
          </div>

          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            searchParams={searchParams}
            basePath={basePath}
          />
        </div>
      </div>
    </div>
  );
}
