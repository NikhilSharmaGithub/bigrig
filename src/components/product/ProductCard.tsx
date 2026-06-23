import Link from "next/link";
import type { ProductCardItem } from "@/lib/types";
import { discountPct, formatPrice } from "@/lib/format";
import { WishlistHeart } from "@/components/wishlist/WishlistHeart";

export function ProductCard({ product }: { product: ProductCardItem }) {
  const discount = discountPct(product.priceCents, product.listPriceCents);

  return (
    <div className="group relative">
    <Link
      href={`/p/${product.slug}`}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square bg-white p-4">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full rounded object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded bg-gradient-to-br from-steel-100 to-steel-200 text-steel-400">
            <PartIcon />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded bg-brand px-2 py-0.5 text-xs font-bold text-white">
            -{discount}%
          </span>
        )}
        {!product.inStock && (
          <span className="absolute bottom-2 right-2 rounded bg-steel-700 px-2 py-0.5 text-xs font-semibold text-white">
            Backorder
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand">
          {product.brand}
        </span>
        <h3 className="mt-0.5 line-clamp-2 text-sm font-medium text-steel-900 group-hover:text-brand">
          {product.name}
        </h3>
        <span className="mt-0.5 text-xs text-steel-500">#{product.partNumber}</span>

        <div className="mt-1 flex items-center gap-1 text-xs text-steel-500">
          <Stars rating={product.ratingAvg} />
          <span>({product.ratingCount})</span>
        </div>

        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-bold text-steel-900">
              {formatPrice(product.priceCents)}
            </span>
            {discount > 0 && product.listPriceCents && (
              <span className="text-xs text-steel-400 line-through">
                {formatPrice(product.listPriceCents)}
              </span>
            )}
          </div>
          <span
            className={`mt-1 block text-xs font-medium ${
              product.inStock ? "text-success" : "text-steel-500"
            }`}
          >
            {product.inStock ? "● In Stock — Ships Today" : "○ Ships in 3–5 days"}
          </span>
        </div>
      </div>
    </Link>
      <WishlistHeart
        slug={product.slug}
        className="absolute right-2 top-2 z-10 h-8 w-8 bg-white/90 text-steel-500 shadow-sm hover:text-brand"
      />
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="text-accent" aria-label={`${rating} out of 5`}>
      {"★★★★★".slice(0, full)}
      <span className="text-steel-300">{"★★★★★".slice(full)}</span>
    </span>
  );
}

function PartIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" strokeLinecap="round" />
      <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
    </svg>
  );
}
