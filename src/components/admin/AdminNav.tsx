"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Admin navigation: the dark sidebar on large screens, a scrollable tab row on phones/tablets. */
export function AdminNav({ items, variant }: { items: NavItem[]; variant: "sidebar" | "bar" }) {
  const pathname = usePathname();
  if (variant === "bar") {
    return (
      <nav
        aria-label="Admin"
        className="-mx-6 -mt-6 mb-5 flex gap-1 overflow-x-auto border-b border-steel-700 bg-steel-900 px-3 py-2 lg:hidden"
      >
        {items.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            aria-current={isActive(pathname, n.href) ? "page" : undefined}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-steel-300 hover:text-white aria-[current=page]:bg-steel-700 aria-[current=page]:text-white"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Admin" className="flex-1 space-y-1 p-3">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={isActive(pathname, n.href) ? "page" : undefined}
          className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-steel-800 hover:text-white aria-[current=page]:bg-steel-800 aria-[current=page]:text-white"
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
