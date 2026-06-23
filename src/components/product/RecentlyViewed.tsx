"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProductCardItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";

const KEY = "brc_recent";

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [items, setItems] = useState<ProductCardItem[]>([]);

  useEffect(() => {
    let list: string[] = [];
    try {
      list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      list = [];
    }

    const toShow = list.filter((s) => s !== currentSlug).slice(0, 6);
    if (toShow.length > 0) {
      fetch(`/api/products/by-slugs?slugs=${toShow.join(",")}`)
        .then((r) => r.json())
        .then((d) => setItems(d.items ?? []))
        .catch(() => {});
    }

    const updated = [currentSlug, ...list.filter((s) => s !== currentSlug)].slice(0, 12);
    try {
      localStorage.setItem(KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }, [currentSlug]);

  if (items.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="font-display border-b-2 border-steel-900 pb-2 text-2xl font-bold uppercase tracking-wide text-steel-900">
        Recently Viewed
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/p/${p.slug}`}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-shadow hover:shadow-md"
          >
            <div className="aspect-square bg-white p-3">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" loading="lazy" />
              ) : (
                <div className="grid h-full w-full place-items-center rounded bg-gradient-to-br from-steel-100 to-steel-200 text-steel-300">
                  <span>∎</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-3">
              <span className="text-xs font-semibold uppercase text-brand">{p.brand}</span>
              <span className="line-clamp-2 text-sm font-medium text-steel-900 group-hover:text-brand">
                {p.name}
              </span>
              <span className="font-display mt-auto pt-2 text-lg font-bold text-steel-900">
                {formatPrice(p.priceCents)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
