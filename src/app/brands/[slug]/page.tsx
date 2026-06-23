import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { SortSelect } from "@/components/catalog/SortSelect";
import { Pagination } from "@/components/catalog/Pagination";
import {
  flattenParams,
  parseListOpts,
  type RawSearchParams,
} from "@/lib/catalog-params";
import { getBrandBySlug, listProducts } from "@/lib/queries";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  return { title: brand?.name ?? "Brand" };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  if (!brand) notFound();

  const sp = flattenParams(await searchParams);
  const result = await listProducts(parseListOpts(sp, { brandSlugs: [slug] }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={[{ label: "Brands", href: "/brands" }, { label: brand.name }]} />
      <div className="mt-4 border-b-2 border-steel-900 pb-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          {brand.name}
        </h1>
        {brand.description && (
          <p className="mt-1 max-w-2xl text-steel-500">{brand.description}</p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-sm text-steel-500">
          <span className="font-semibold text-steel-700">{result.total}</span> parts
        </p>
        <SortSelect />
      </div>

      <div className="mt-4">
        <ProductGrid items={result.items} />
      </div>

      <Pagination
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        searchParams={sp}
        basePath={`/brands/${slug}`}
      />
    </div>
  );
}
