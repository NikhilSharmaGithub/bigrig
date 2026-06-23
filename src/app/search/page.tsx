import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import {
  flattenParams,
  parseListOpts,
  type RawSearchParams,
} from "@/lib/catalog-params";
import { listProducts } from "@/lib/queries";

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const sp = flattenParams(await searchParams);
  return { title: sp.q ? `Search: ${sp.q}` : "Search" };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = flattenParams(await searchParams);
  const q = sp.q?.trim() ?? "";

  const result = q
    ? await listProducts(parseListOpts(sp, { q }))
    : { items: [], total: 0, page: 1, pageSize: 24, brandFacets: [] };

  return (
    <CatalogView
      title={q ? `Results for “${q}”` : "Search"}
      description={
        q ? `${result.total} part${result.total === 1 ? "" : "s"} found` : "Enter a part number, name, or brand above."
      }
      breadcrumbs={[{ label: "Search" }]}
      result={result}
      searchParams={sp}
      basePath="/search"
    />
  );
}
