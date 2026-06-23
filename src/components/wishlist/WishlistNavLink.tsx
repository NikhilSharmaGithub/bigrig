"use client";

import Link from "next/link";
import { useWishlist } from "@/components/wishlist/WishlistProvider";

export function WishlistNavLink() {
  const wl = useWishlist();
  const count = wl?.count ?? 0;

  return (
    <Link
      href="/account/wishlist"
      className="relative flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-steel-800"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="hidden xl:inline">Saved</span>
      {count > 0 && (
        <span className="absolute -right-0 -top-0 grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
