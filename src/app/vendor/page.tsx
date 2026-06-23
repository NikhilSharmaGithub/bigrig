import Link from "next/link";
import type { Metadata } from "next";
import { requireVendor, getVendorStats } from "@/lib/vendor";
import { ConnectPayoutsButton } from "@/components/vendor/ConnectPayoutsButton";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Seller Dashboard" };

export default async function VendorDashboard() {
  const { vendor } = await requireVendor();
  const stats = await getVendorStats(vendor.id);

  const cards = [
    { label: "Products", value: String(stats.productCount), href: "/vendor/products" },
    { label: "Units Sold", value: String(stats.unitsSold), href: "/vendor/orders" },
    { label: "Revenue", value: formatPrice(stats.revenueCents), href: "/vendor/orders" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          {vendor.storeName}
        </h1>
        <Link
          href="/vendor/products/new"
          className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
        >
          + Add Product
        </Link>
      </div>

      {vendor.status !== "approved" && (
        <p className="mt-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-steel-700">
          Your store is <strong>{vendor.status}</strong>. Listings may not be
          visible to shoppers until an admin approves your store.
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-border bg-white p-5 transition-all hover:border-brand hover:shadow-md"
          >
            <p className="text-xs uppercase tracking-wide text-steel-500">
              {c.label}
            </p>
            <p className="font-display mt-1 text-3xl font-bold text-steel-900">
              {c.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Payouts */}
      <div className="mt-8 rounded-lg border border-border bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold uppercase text-steel-900">
              Payouts
            </h2>
            <p className="mt-1 text-sm text-steel-600">
              {vendor.payoutsEnabled
                ? "✓ Connected — your earnings are transferred automatically after each sale."
                : "Connect a Stripe account to receive your share of each sale (after platform commission)."}
            </p>
          </div>
          <ConnectPayoutsButton connected={Boolean(vendor.stripeAccountId)} />
        </div>
      </div>
    </div>
  );
}
