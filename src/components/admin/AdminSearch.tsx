"use client";

import { usePathname } from "next/navigation";

/** Panel-wide part search; hidden on the product list, which has its own search bar. */
export function AdminSearch() {
  const pathname = usePathname();
  if (pathname === "/admin/products") return null;
  return (
    <form action="/admin/products" role="search" className="mb-5 flex max-w-xl gap-2">
      <input
        type="search"
        name="q"
        placeholder="Search parts by part number or name…"
        aria-label="Search parts"
        className="min-w-0 flex-1 rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button type="submit" className="rounded-md bg-steel-900 px-4 text-sm font-semibold text-white hover:bg-steel-700">
        Search
      </button>
    </form>
  );
}
