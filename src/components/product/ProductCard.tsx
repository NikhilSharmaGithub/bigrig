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
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded bg-gradient-to-br from-steel-100 to-steel-200 text-steel-400">
            <PartIcon />
            <span className="text-[11px] font-medium uppercase tracking-wide">
              Image coming soon
            </span>
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
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
