import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-full bg-steel-50">
      <div className="mx-auto flex max-w-[1400px] gap-0">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-steel-900 text-steel-300 lg:flex">
          <div className="border-b border-steel-700 p-4">
            <p className="font-display text-lg font-bold uppercase tracking-wide text-white">
              BRC Admin
            </p>
            <p className="truncate text-xs text-steel-400">{admin.email}</p>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-steel-800 hover:text-white"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-1 border-t border-steel-700 p-3">
            <Link
              href="/"
              className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-steel-800 hover:text-white"
            >
              ← View Store
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-steel-800 hover:text-danger"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
