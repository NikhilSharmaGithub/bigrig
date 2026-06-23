import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { categories } from "@/lib/catalog";
import { SearchBar } from "@/components/layout/SearchBar";
import { CartBadge } from "@/components/cart/CartBadge";
import { WishlistNavLink } from "@/components/wishlist/WishlistNavLink";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top utility bar */}
      <div className="bg-steel-950 text-steel-300 text-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span className="hidden sm:inline">
            Free shipping over $99 · 30-day hassle-free returns
          </span>
          <div className="flex items-center gap-4">
            <a href="tel:+18005551234" className="hover:text-white">
              1-800-555-1234
            </a>
            <Link href="/sell" className="font-semibold text-accent hover:text-white">
              Sell on BRC
            </Link>
            <Link href="/track" className="hover:text-white">
              Track Order
            </Link>
            <Link href="/help" className="hover:text-white">
              Help
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-steel-900 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Logo />
          <div className="hidden flex-1 lg:block">
            <SearchBar />
          </div>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <WishlistNavLink />
            <Link
              href="/account"
              className="flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-steel-800"
            >
              <UserIcon />
              <span className="hidden xl:inline">Account</span>
            </Link>
            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded px-3 py-2 text-sm hover:bg-steel-800"
            >
              <CartIcon />
              <span className="hidden xl:inline">Cart</span>
              <CartBadge />
            </Link>
          </div>
        </div>
        {/* Mobile search */}
        <div className="px-4 pb-3 lg:hidden">
          <SearchBar />
        </div>
      </div>

      {/* Category nav */}
      <nav className="bg-steel-800 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-stretch gap-0 overflow-x-auto px-2">
          {categories.map((cat) => (
            <div key={cat.slug} className="group relative">
              <Link
                href={`/c/${cat.slug}`}
                className="flex h-full items-center whitespace-nowrap px-3 py-3 text-sm font-medium text-steel-200 transition-colors hover:bg-brand hover:text-white"
              >
                {cat.name}
              </Link>
              {/* Dropdown */}
              <div className="invisible absolute left-0 top-full z-50 w-64 translate-y-1 rounded-b-lg border border-border bg-white p-2 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                {cat.subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/c/${cat.slug}/${sub.slug}`}
                    className="block rounded px-3 py-2 text-sm text-steel-700 hover:bg-steel-50 hover:text-brand"
                  >
                    {sub.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </header>
  );
}

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.5a1.5 1.5 0 0 0 1.5-1.2L22 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
