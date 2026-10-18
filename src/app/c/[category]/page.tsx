import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import {
  flattenParams,
  parseListOpts,
  type RawSearchParams,
} from "@/lib/catalog-params";
import { SubcategoryChips } from "@/components/catalog/SubcategoryChips";
import { getCategoryBySlug, getNavCategories, listProducts } from "@/lib/queries";

type Props = {
  params: Promise<{ category: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) return { title: "Category" };
  return {
    title: cat.name,
    description: cat.blurb ?? `Shop ${cat.name} for heavy-duty trucks.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { category } = await params;
  const cat = await getCategoryBySlug(category);
  if (!cat) notFound();

  const sp = flattenParams(await searchParams);
  const result = await listProducts(
    parseListOpts(sp, { categorySlug: category }),
  );

  const nav = await getNavCategories();
  const subnav = (
    <SubcategoryChips
      parentSlug={cat.slug}
      subcategories={nav.find((c) => c.slug === cat.slug)?.subcategories ?? []}
    />
  );

  return (
    <CatalogView
      title={cat.name}
      description={cat.blurb ?? undefined}
      breadcrumbs={[{ label: "Categories", href: "/c" }, { label: cat.name }]}
      result={result}
      searchParams={sp}
      basePath={`/c/${cat.slug}`}
      subnav={subnav}
    />
  );
}
