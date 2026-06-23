import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { categories } from "@/lib/catalog";

const footerCols: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "All Categories", href: "/c" },
      { label: "Shop by Vehicle", href: "/vehicle" },
      { label: "Top Brands", href: "/brands" },
      { label: "Deals", href: "/deals" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/help" },
      { label: "Track Order", href: "/track" },
      { label: "Returns & RMA", href: "/returns" },
      { label: "Shipping Info", href: "/shipping" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "BRC Pro", href: "/pro" },
      { label: "Financing", href: "/financing" },
      { label: "Careers", href: "/careers" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-steel-900 text-steel-300">
      <div className="hazard-stripes h-2 w-full" />
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-steel-400">
              Heavy-duty truck &amp; trailer parts for fleets and owner-operators.
              Millions of parts, real-time inventory, expert support.
            </p>
            <a
              href="tel:+18005551234"
              className="mt-4 inline-block font-display text-2xl font-bold text-white"
            >
              1-800-555-1234
            </a>
          </div>
          {footerCols.map((col) => (
            <div key={col.title}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-steel-700 pt-6">
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-steel-400">
            Popular Categories
          </h4>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-steel-400">
            {categories.map((c) => (
              <Link key={c.slug} href={`/c/${c.slug}`} className="hover:text-white">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-steel-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-steel-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Big Rig Components. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <a href="/sitemap.xml" className="hover:text-white">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
