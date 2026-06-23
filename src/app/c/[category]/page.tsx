import Link from "next/link";
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

  const subnav =
    cat.children.length > 0 ? (
      <div className="mt-4 flex flex-wrap gap-2">
        {cat.children.map((sub) => (
          <Link
            key={sub.id}
            href={`/c/${cat.slug}/${sub.slug}`}
            className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-steel-700 transition-colors hover:border-brand hover:text-brand"
          >
            {sub.name}
          </Link>
        ))}
      </div>
    ) : null;

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
