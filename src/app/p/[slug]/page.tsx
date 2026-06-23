import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { ProductGallery } from "@/components/product/ProductGallery";
import { AddToCart } from "@/components/product/AddToCart";
import { ProductReviews } from "@/components/product/ProductReviews";
import { ProductQA } from "@/components/product/ProductQA";
import { WishlistHeart } from "@/components/wishlist/WishlistHeart";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { JsonLd } from "@/components/seo/JsonLd";
import { discountPct, formatPrice } from "@/lib/format";
import {
  getProductBySlug,
  getRelatedProducts,
  getFrequentlyBoughtTogether,
} from "@/lib/queries";
import { getActiveVehicle, productFitsVehicle, formatVehicle } from "@/lib/garage";
import { SITE } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

function splitLines(s: string | null | undefined): string[] {
  return (s ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function splitParagraphs(s: string | null | undefined): string[] {
  return (s ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Part Not Found" };

  // A custom meta title is used verbatim (absolute); otherwise the layout
  // template appends "| Big Rig Components".
  const title: Metadata["title"] = p.metaTitle
    ? { absolute: p.metaTitle }
    : `${p.name} — ${p.partNumber}`;
  const ogTitle = p.metaTitle || `${p.name} — ${p.partNumber}`;
  const description = (
    p.metaDescription ||
    p.description ||
    `${p.name}${p.brand ? ` by ${p.brand.name}` : ""} — heavy-duty truck & trailer part. In stock at Big Rig Components.`
  ).slice(0, 200);
  const keywords = p.keywords
    ? p.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;
  const image = p.images[0]?.url;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: {
      title: ogTitle,
      description,
      type: "website",
      url: `${SITE.url}/p/${p.slug}`,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: ogTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const qty = product.inventory?.quantity ?? 0;
  const inStock = qty > 0;
  const discount = discountPct(product.priceCents, product.listPriceCents);
  const related = await getRelatedProducts(product.categoryId, product.slug);
  const boughtTogether = await getFrequentlyBoughtTogether(product.id);
  const activeVehicle = await getActiveVehicle();
  const fitsActive = activeVehicle
    ? await productFitsVehicle(product.id, activeVehicle.id)
    : null;
  const highlights = splitLines(product.highlights);
  const paragraphs = splitParagraphs(product.description);
  const rating = Number(product.ratingAvg);

  const fitByMake = new Map<string, string[]>();
  for (const f of product.fitment) {
    const v = f.vehicle;
    const years = v.yearStart && v.yearEnd ? ` (${v.yearStart}–${v.yearEnd})` : "";
    const list = fitByMake.get(v.make) ?? [];
    list.push(`${v.model}${years}`);
    fitByMake.set(v.make, list);
  }

  const crumbs = [
    { label: "Categories", href: "/c" },
    ...(product.category?.parent
      ? [{ label: product.category.parent.name, href: `/c/${product.category.parent.slug}` }]
      : []),
    ...(product.category
      ? [
          {
            label: product.category.name,
            href: product.category.parent
              ? `/c/${product.category.parent.slug}/${product.category.slug}`
              : `/c/${product.category.slug}`,
          },
        ]
      : []),
    { label: product.name },
  ];

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.partNumber,
    mpn: product.partNumber,
    description: product.metaDescription ?? product.description ?? undefined,
    image: product.images.map((i) => i.url),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.keywords ? { keywords: product.keywords } : {}),
    aggregateRating:
      product.ratingCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: rating,
            reviewCount: product.ratingCount,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.priceCents / 100).toFixed(2),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/BackOrder",
      url: `${SITE.url}/p/${product.slug}`,
      ...(product.vendor ? { seller: { "@type": "Organization", name: product.vendor.storeName } } : {}),
    },
  };

  const breadcrumbItems: { name: string; href?: string }[] = [
    { name: "Home", href: "/" },
    ...crumbs.map((c) => ({ name: c.label, href: c.href })),
  ];
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      ...(c.href ? { item: `${SITE.url}${c.href}` } : {}),
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <Breadcrumbs items={crumbs} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} />

        {/* Buy box / key info */}
        <div>
          {product.brand && (
            <Link
              href={`/brands/${product.brand.slug}`}
              className="text-sm font-semibold uppercase tracking-wide text-brand hover:underline"
            >
              {product.brand.name}
            </Link>
          )}
          <h1 className="font-display mt-1 text-3xl font-bold leading-tight text-steel-900">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-steel-500">Part #{product.partNumber}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-accent" aria-label={`${rating} out of 5`}>
              {"★★★★★".slice(0, Math.round(rating))}
              <span className="text-steel-300">{"★★★★★".slice(Math.round(rating))}</span>
            </span>
            <span className="text-steel-500">
              {rating.toFixed(1)} · {product.ratingCount} ratings
            </span>
            {product.vendor && (
              <span className="text-steel-500">
                · Sold by{" "}
                <Link href={`/store/${product.vendor.slug}`} className="font-semibold text-brand hover:underline">
                  {product.vendor.storeName}
                </Link>
              </span>
            )}
          </div>

          {/* Fits your truck */}
          {activeVehicle && (
            <div
              className={`mt-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium ${
                fitsActive
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-accent/40 bg-accent/10 text-steel-700"
              }`}
            >
              {fitsActive ? "✓" : "⚠"}{" "}
              {fitsActive
                ? `Fits your ${formatVehicle(activeVehicle)}`
                : `Not listed for your ${formatVehicle(activeVehicle)} — check fitment`}
            </div>
          )}

          {/* About this item */}
          {highlights.length > 0 && (
            <div className="mt-5 border-t border-border pt-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-steel-900">
                About this item
              </h2>
              <ul className="mt-2 space-y-1.5">
                {highlights.slice(0, 8).map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-steel-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price + buy */}
          <div className="mt-5 rounded-xl border border-border bg-surface p-5">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-steel-900">
                {formatPrice(product.priceCents)}
              </span>
              {discount > 0 && product.listPriceCents && (
                <>
                  <span className="text-lg text-steel-400 line-through">
                    {formatPrice(product.listPriceCents)}
                  </span>
                  <span className="rounded bg-brand px-2 py-0.5 text-sm font-bold text-white">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>
            <p className={`mt-2 text-sm font-medium ${inStock ? "text-success" : "text-steel-500"}`}>
              {inStock ? `● In Stock (${qty}) — Ships Today` : "○ Backorder — Ships in 3–5 days"}
            </p>
            <div className="mt-4">
              <AddToCart productSlug={product.slug} disabled={!inStock} />
            </div>
            <WishlistHeart
              slug={product.slug}
              label
              className="mt-3 rounded-md border border-border px-4 py-2 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
            />
            <ul className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs text-steel-600">
              <li>✓ Fitment verified</li>
              <li>✓ 30-day returns</li>
              <li>✓ Ships from Dallas, TX</li>
              <li>✓ Expert phone support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {paragraphs.length > 0 && (
            <section>
              <h2 className="font-display border-b-2 border-steel-900 pb-2 text-xl font-bold uppercase tracking-wide text-steel-900">
                Product Description
              </h2>
              <div className="mt-4 space-y-3 leading-relaxed text-steel-700">
                {paragraphs.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

          {highlights.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display border-b-2 border-steel-900 pb-2 text-xl font-bold uppercase tracking-wide text-steel-900">
                Key Features
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex gap-2 rounded-lg border border-border bg-white p-3 text-sm text-steel-700">
                    <span className="text-brand">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {product.specs.length > 0 && (
            <section className="mt-8">
              <h2 className="font-display border-b-2 border-steel-900 pb-2 text-xl font-bold uppercase tracking-wide text-steel-900">
                Specifications
              </h2>
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {product.specs.map((s) => (
                    <tr key={s.id} className="border-b border-border">
                      <th className="w-1/3 py-2.5 text-left font-medium text-steel-500">{s.name}</th>
                      <td className="py-2.5 text-steel-900">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>

        {/* Fitment */}
        <aside>
          <h2 className="font-display border-b-2 border-steel-900 pb-2 text-xl font-bold uppercase tracking-wide text-steel-900">
            Fits These Trucks
          </h2>
          {fitByMake.size > 0 ? (
            <div className="mt-3 space-y-3">
              {[...fitByMake.entries()].map(([make, models]) => (
                <div key={make} className="rounded-lg border border-border bg-surface p-3">
                  <p className="font-display font-bold text-steel-900">{make}</p>
                  <p className="mt-0.5 text-sm text-steel-600">{models.join(" · ")}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-steel-500">Universal / contact us for fitment.</p>
          )}
        </aside>
      </div>

      {/* Frequently bought together */}
      {boughtTogether.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display border-b-2 border-steel-900 pb-2 text-2xl font-bold uppercase tracking-wide text-steel-900">
            Frequently Bought Together
          </h2>
          <div className="mt-6">
            <ProductGrid items={boughtTogether} />
          </div>
        </section>
      )}

      {/* Reviews */}
      <ProductReviews productId={product.id} slug={product.slug} />

      {/* Questions & Answers */}
      <ProductQA productId={product.id} slug={product.slug} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display border-b-2 border-steel-900 pb-2 text-2xl font-bold uppercase tracking-wide text-steel-900">
            Related Parts
          </h2>
          <div className="mt-6">
            <ProductGrid items={related} />
          </div>
        </section>
      )}

      <RecentlyViewed currentSlug={product.slug} />
    </div>
  );
}
