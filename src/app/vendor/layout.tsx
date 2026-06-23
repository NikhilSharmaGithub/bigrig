import Link from "next/link";
import { requireVendor } from "@/lib/vendor";

const NAV = [
  { href: "/vendor", label: "Dashboard" },
  { href: "/vendor/products", label: "My Products" },
  { href: "/vendor/orders", label: "Orders" },
];

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { vendor } = await requireVendor();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside>
          <div className="rounded-lg border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-steel-500">
              Your store
            </p>
            <p className="font-display truncate font-bold text-steel-900">
              {vendor.storeName}
            </p>
            <span
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                vendor.status === "approved"
                  ? "bg-success/15 text-success"
                  : vendor.status === "pending"
                    ? "bg-accent/20 text-accent-dark"
                    : "bg-danger/10 text-danger"
              }`}
            >
              {vendor.status}
            </span>
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
            <Link
              href={`/store/${vendor.slug}`}
              className="block rounded-md px-3 py-2 text-sm font-medium text-steel-500 hover:bg-steel-50 hover:text-brand"
            >
              View Storefront →
            </Link>
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
