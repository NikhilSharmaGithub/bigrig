import Link from "next/link";
import { categories, topBrands, truckMakes } from "@/lib/catalog";
import { featuredProducts } from "@/lib/sample-products";
import type { ProductCardItem } from "@/lib/types";
import { getTopSellers, getDeals, getAllBrands } from "@/lib/queries";
import { discountPct, formatPrice } from "@/lib/format";
import { ProductCard } from "@/components/product/ProductCard";
import { HomeVehicleFinder } from "@/components/home/HomeVehicleFinder";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Live data with a graceful fallback so the page renders even without a DB.
  let topSellers: ProductCardItem[] = featuredProducts;
  let deals: ProductCardItem[] = [];
  try {
    const [sellers, dealItems] = await Promise.all([
      getTopSellers(8),
      getDeals(4),
    ]);
    if (sellers.length) topSellers = sellers;
    deals = dealItems;
  } catch {
    // No DB — keep the sample top-sellers, skip deals.
  }

  // Brands from the database (admin-managed, with logos); fall back to the
  // static list if none are available. Brands that have a logo come first.
  const dbBrands = await getAllBrands();
  const brandTiles: { slug: string; name: string; logoUrl: string | null }[] =
    dbBrands.length > 0
      ? [...dbBrands]
          .sort((a, b) => Number(Boolean(b.logoUrl)) - Number(Boolean(a.logoUrl)))
          .slice(0, 12)
          .map((b) => ({ slug: b.slug, name: b.name, logoUrl: b.logoUrl }))
      : topBrands.map((b) => ({ ...b, logoUrl: null }));

  return (
    <>
      {/* Hero + vehicle finder */}
      <section className="relative overflow-hidden bg-steel-950 text-white">
        <div className="hazard-stripes absolute inset-x-0 top-0 h-1.5" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(228,0,43,0.18),transparent_60%)]"
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-light">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-light" />
              Heavy-duty truck &amp; trailer parts
            </span>
            <h1 className="font-display mt-4 text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              The right part for your rig,
              <span className="block text-brand">in stock &amp; ready to roll.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-steel-300">
              Live stock levels on every part, fitment listed by truck, and
              shipping that keeps you moving.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/vehicle"
                className="font-display rounded-md bg-brand px-7 py-3 text-lg font-semibold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-brand-dark"
              >
                Shop by Vehicle
              </Link>
              <Link
                href="/c"
                className="font-display rounded-md border border-steel-600 px-7 py-3 text-lg font-semibold uppercase tracking-wider text-white transition-colors hover:bg-steel-800"
              >
                Browse Categories
              </Link>
            </div>
          </div>

          <HomeVehicleFinder makes={truckMakes} />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border md:grid-cols-4">
          {TRUST.map((t) => (
            <div key={t.title} className="flex items-center gap-3 bg-white px-4 py-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-steel-900 text-white">
                {t.icon}
              </span>
              <div>
                <p className="font-display text-base font-bold uppercase leading-tight tracking-wide text-steel-900">
                  {t.title}
                </p>
                <p className="text-xs text-steel-500">{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by category */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <SectionHeading title="Shop by Component Category" href="/c" linkLabel="View all" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/c/${cat.slug}`}
              className="group flex flex-col rounded-lg border border-border bg-white p-5 transition-all hover:border-brand hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-steel-900 text-white transition-colors group-hover:bg-brand">
                  <CategoryGlyph />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold uppercase leading-tight tracking-wide text-steel-900 group-hover:text-brand">
                    {cat.name}
                  </h3>
                  <p className="mt-1 text-sm text-steel-500">{cat.blurb}</p>
                </div>
              </div>
              <span className="mt-4 text-sm font-semibold text-brand">
                Shop {cat.name} <span aria-hidden="true">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top sellers */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeading title="Top Sellers Ready to Roll" href="/c" linkLabel="Shop all" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {topSellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Deals */}
      {deals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <SectionHeading title="Today's Deals" href="/deals" linkLabel="Shop deals" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {deals.map((p) => (
              <DealCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Brands */}
      <section className="border-y border-border bg-steel-50">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-steel-700">
            Heavy-Duty Brands We Carry
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {brandTiles.map((b) => (
              <Link
                key={b.slug}
                href={`/brands/${b.slug}`}
                title={b.name}
                className="font-display flex h-16 items-center justify-center rounded border border-border bg-white px-4 text-lg font-bold uppercase tracking-wider text-steel-800 transition-colors hover:border-brand hover:text-brand"
              >
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.logoUrl}
                    alt={b.name}
                    className="max-h-10 max-w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  b.name
                )}
              </Link>
            ))}
          </div>
          <Link
            href="/brands"
            className="mt-6 inline-block text-sm font-semibold text-brand hover:underline"
          >
            All brands →
          </Link>
        </div>
      </section>

      {/* Nova Pro CTA */}
      <section className="bg-steel-900 px-4 py-14 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 rounded-lg border border-steel-700 bg-steel-950 p-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <span className="inline-block rounded bg-accent/20 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
              Commercial fleet accounts
            </span>
            <h2 className="font-display mt-3 text-4xl font-bold uppercase leading-none tracking-tight sm:text-5xl">
              Run a fleet? Upgrade to <span className="text-accent">Nova Pro</span>
            </h2>
            <p className="mt-3 text-steel-300">
              Volume pricing, net terms, and a dedicated parts specialist for
              your team.
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-steel-400">
              {["Volume pricing", "Net terms", "Dedicated parts specialist"].map((x) => (
                <li key={x} className="flex items-center gap-1.5">
                  <span className="text-accent">✓</span> {x}
                </li>
              ))}
            </ul>
          </div>
          <Link
            href="/pro"
            className="font-display shrink-0 rounded-md bg-brand px-8 py-3.5 text-lg font-semibold uppercase tracking-wider text-white shadow-md transition-colors hover:bg-brand-dark"
          >
            Learn about Nova Pro
          </Link>
        </div>
      </section>
    </>
  );
}

function DealCard({ product }: { product: ProductCardItem }) {
  const pct = discountPct(product.priceCents, product.listPriceCents);
  return (
    <Link
      href={`/p/${product.slug}`}
      className="flex items-center gap-3.5 rounded-md border border-red-200 bg-red-50/30 p-3.5 transition-all hover:bg-white hover:shadow-md"
    >
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded border border-border bg-white">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="h-full w-full object-contain" loading="lazy" />
        ) : (
          <span className="font-display text-2xl font-bold text-brand">-{pct}%</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold uppercase text-steel-600">{product.brand}</div>
        <h3 className="font-display truncate text-lg font-bold uppercase leading-tight text-steel-900">
          {product.name}
        </h3>
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="font-display text-xl font-bold text-brand">
            {formatPrice(product.priceCents)}
          </span>
          {product.listPriceCents && pct > 0 && (
            <span className="text-sm text-steel-400 line-through">
              {formatPrice(product.listPriceCents)}
            </span>
          )}
        </div>
      </div>
    </Link>
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
      <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        {title}
      </h2>
      <Link href={href} className="text-sm font-semibold text-brand hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const TRUST = [
  {
    title: "Live Stock Levels",
    sub: "See what’s in stock on every part",
    icon: (
      <svg {...iconProps}>
        <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </svg>
    ),
  },
  {
    title: "Shop by Truck",
    sub: "Filter by make, model & year",
    icon: (
      <svg {...iconProps}>
        <path d="M3 13h11V6H3zM14 9h4l3 4v3h-7z" />
        <circle cx="6.5" cy="17" r="1.8" />
        <circle cx="17.5" cy="17" r="1.8" />
      </svg>
    ),
  },
  {
    title: "30-Day Returns",
    sub: "Hassle-free, backed by warranty",
    icon: (
      <svg {...iconProps}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    ),
  },
  {
    title: "Email Support",
    sub: "Parts questions answered by email",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
];

function CategoryGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 13h11V6H3zM14 9h4l3 4v3h-7z" strokeLinejoin="round" />
      <circle cx="6.5" cy="17" r="1.8" />
      <circle cx="17.5" cy="17" r="1.8" />
    </svg>
  );
}
