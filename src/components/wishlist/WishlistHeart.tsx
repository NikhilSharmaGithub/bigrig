"use client";

import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function WishlistHeart({
  slug,
  className,
  size = 18,
  label,
}: {
  slug: string;
  className?: string;
  size?: number;
  label?: boolean;
}) {
  const wl = useWishlist();
  const active = wl?.has(slug) ?? false;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        wl?.toggle(slug);
      }}
      aria-label={active ? "Remove from saved" : "Save to wishlist"}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 transition-colors ${className ?? ""}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={active ? "var(--color-brand)" : "none"}
        stroke={active ? "var(--color-brand)" : "currentColor"}
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label && <span>{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
