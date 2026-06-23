import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import {
  flattenParams,
  parseListOpts,
  type RawSearchParams,
} from "@/lib/catalog-params";
import { getCategoryBySlug, listProducts } from "@/lib/queries";

type Props = {
  params: Promise<{ category: string; sub: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sub } = await params;
  const cat = await getCategoryBySlug(sub);
  return { title: cat?.name ?? "Parts" };
}

export default async function SubcategoryPage({ params, searchParams }: Props) {
  const { category, sub } = await params;
  const subCat = await getCategoryBySlug(sub);
  if (!subCat) notFound();

  const parentName = subCat.parent?.name ?? category;
  const sp = flattenParams(await searchParams);
  const result = await listProducts(parseListOpts(sp, { categorySlug: sub }));

  return (
    <CatalogView
      title={subCat.name}
      breadcrumbs={[
        { label: "Categories", href: "/c" },
        { label: parentName, href: `/c/${category}` },
        { label: subCat.name },
      ]}
      result={result}
      searchParams={sp}
      basePath={`/c/${category}/${sub}`}
    />
  );
}
