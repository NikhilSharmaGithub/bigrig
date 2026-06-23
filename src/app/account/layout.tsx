import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";

const NAV = [
  { href: "/account", label: "Dashboard" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Saved Items" },
  { href: "/account/garage", label: "My Garage" },
  { href: "/account/returns", label: "Returns" },
  { href: "/account/addresses", label: "Addresses" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-steel-500">
              Signed in as
            </p>
            <p className="truncate font-medium text-steel-900">
              {user.name ?? user.email}
            </p>
          </div>
          <nav className="mt-4 space-y-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-steel-700 hover:bg-steel-50 hover:text-brand"
              >
                {n.label}
              </Link>
            ))}
            <form action={logoutAction}>
              <button
                type="submit"
                className="mt-2 block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-steel-500 hover:bg-steel-50 hover:text-danger"
              >
                Sign Out
              </button>
            </form>
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
