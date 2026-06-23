import Link from "next/link";
import { categories, topBrands, truckMakes } from "@/lib/catalog";
import { featuredProducts } from "@/lib/sample-products";
import type { ProductCardItem } from "@/lib/types";
import { getTopSellers, getDeals } from "@/lib/queries";
import { ProductCard } from "@/components/product/ProductCard";
import { HomeVehicleFinder } from "@/components/home/HomeVehicleFinder";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Live data with a graceful fallback so the page renders even without a DB.
  let topSellers: ProductCardItem[] = featuredProducts;
  let deals: ProductCardItem[] = [];
  try {
    const [sellers, dealItems] = await Promise.all([
      getTopSellers(6),
      getDeals(6),
    ]);
    if (sellers.length) topSellers = sellers;
    deals = dealItems;
  } catch {
    // No DB — keep the sample top-sellers, skip deals.
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-steel-900 text-white">
        <div className="hazard-stripes absolute inset-x-0 top-0 h-1.5" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <span className="inline-block rounded bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-light">
              4,000+ brands · millions of parts
            </span>
            <h1 className="font-display mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              The right part for your rig,
              <span className="text-brand"> in stock and ready to roll.</span>
            </h1>
            <p className="mt-4 max-w-lg text-steel-300">
              Heavy-duty truck &amp; trailer parts with real-time inventory,
              fitment you can trust, and shipping that keeps you moving.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/vehicle"
                className="rounded-md bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Shop by Vehicle
              </Link>
              <Link
                href="/c"
                className="rounded-md border border-steel-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-steel-800"
              >
                Browse Categories
              </Link>
            </div>
          </div>

          {/* Vehicle finder */}
          <HomeVehicleFinder makes={truckMakes} />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 text-center md:grid-cols-4">
          {[
            ["Real-Time Inventory", "Live stock from coast to coast"],
            ["Fitment Verified", "Parts guaranteed to fit your rig"],
            ["30-Day Returns", "Hassle-free, backed by warranty"],
            ["Expert Support", "Parts pros a phone call away"],
          ].map(([title, sub]) => (
            <div key={title}>
              <p className="font-display text-sm font-bold uppercase tracking-wide text-steel-900">
                {title}
              </p>
              <p className="mt-0.5 text-xs text-steel-500">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeading title="Shop by Category" href="/c" linkLabel="View all" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/c/${cat.slug}`}
              className="group flex items-start gap-4 rounded-lg border border-border bg-white p-5 transition-all hover:border-brand hover:shadow-md"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-steel-900 text-white transition-colors group-hover:bg-brand">
                <CategoryGlyph />
              </span>
              <span>
                <span className="font-display block font-bold text-steel-900 group-hover:text-brand">
                  {cat.name}
                </span>
                <span className="mt-0.5 block text-xs text-steel-500">{cat.blurb}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top sellers */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeading title="Top Sellers" href="/c" linkLabel="Shop all" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {topSellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeading title="Today's Deals" href="/deals" linkLabel="Shop deals" />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {deals.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Top brands */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeading title="Top Brands" href="/brands" linkLabel="All brands" />
        <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {topBrands.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="flex h-20 items-center justify-center rounded-lg border border-border bg-white px-4 text-center font-display text-lg font-bold text-steel-700 transition-all hover:border-brand hover:text-brand hover:shadow-md"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="hazard-stripes">
        <div className="bg-steel-900/95">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-center sm:flex-row sm:text-left">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                Run a fleet? Get BRC Pro.
              </h2>
              <p className="mt-1 text-steel-300">
                Volume pricing, net terms, and a dedicated parts specialist.
              </p>
            </div>
            <Link
              href="/pro"
              className="shrink-0 rounded-md bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Learn about BRC Pro
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between border-b-2 border-steel-900 pb-2">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-steel-900">
        {title}
      </h2>
      <Link href={href} className="text-sm font-semibold text-brand hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

function CategoryGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 13h11V6H3zM14 9h4l3 4v3h-7z" strokeLinejoin="round" />
      <circle cx="6.5" cy="17" r="1.8" />
      <circle cx="17.5" cy="17" r="1.8" />
    </svg>
  );
}
