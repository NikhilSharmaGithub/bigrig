import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import {
  flattenParams,
  parseListOpts,
  type RawSearchParams,
} from "@/lib/catalog-params";
import { listProducts } from "@/lib/queries";
import { getVendorBySlug } from "@/lib/vendor";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  return {
    title: vendor ? `${vendor.storeName} — Store` : "Store",
    description: vendor?.bio ?? undefined,
  };
}

export default async function StorePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const sp = flattenParams(await searchParams);
  const result = await listProducts(parseListOpts(sp, { vendorId: vendor.id }));

  return (
    <CatalogView
      title={vendor.storeName}
      description={vendor.bio ?? "Marketplace seller on Big Rig Components"}
      breadcrumbs={[{ label: "Stores" }, { label: vendor.storeName }]}
      result={result}
      searchParams={sp}
      basePath={`/store/${vendor.slug}`}
    />
  );
}
