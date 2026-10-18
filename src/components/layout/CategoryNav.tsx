"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { NavCategory } from "@/lib/queries";

/**
 * Category bar + mega-menu. The panel is a sibling of the horizontally
 * scrolling row, not a child: an overflow-x:auto row also clips vertically,
 * which hid the old per-item dropdowns entirely.
 */
export function CategoryNav({ categories }: { categories: NavCategory[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = (slug: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(slug);
  };
  const hideSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 150);
  };

  const active = categories.find((c) => c.slug === open);

  return (
    <nav
      className="relative bg-steel-800 text-white shadow-md"
      onMouseLeave={hideSoon}
      onKeyDown={(e) => e.key === "Escape" && setOpen(null)}
    >
      {/* fade hints that the category row scrolls sideways when it doesn't fit */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-steel-800 to-transparent" />
      <div className="mx-auto flex max-w-7xl items-stretch overflow-x-auto px-2 pr-8">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/c/${cat.slug}`}
            onMouseEnter={() => show(cat.slug)}
            onFocus={() => show(cat.slug)}
            aria-expanded={open === cat.slug}
            className={`flex items-center whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors hover:bg-brand hover:text-white ${
              open === cat.slug ? "bg-brand text-white" : "text-steel-200"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {active && (
        <div
          onMouseEnter={() => show(active.slug)}
          className="absolute inset-x-0 top-full z-50 border-b border-border bg-white text-steel-900 shadow-xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-5">
            <div className="flex items-baseline justify-between gap-4">
              <p className="font-display text-lg font-bold uppercase tracking-wide">
                {active.name}
              </p>
              <Link
                href={`/c/${active.slug}`}
                onClick={() => setOpen(null)}
                className="text-sm font-semibold text-brand hover:underline"
              >
                Shop all {active.name} →
              </Link>
            </div>
            {active.subcategories.length > 0 ? (
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-4">
                {active.subcategories.map((sub) => (
                  <li key={sub.slug}>
                    <Link
                      href={`/c/${active.slug}/${sub.slug}`}
                      onClick={() => setOpen(null)}
                      className="flex items-center justify-between rounded px-2 py-2 text-sm text-steel-700 hover:bg-steel-50 hover:text-brand"
                    >
                      <span>{sub.name}</span>
                      {sub.count > 0 && (
                        <span className="text-xs text-steel-400">{sub.count}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-steel-500">
                New parts in this category are coming soon.
              </p>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
