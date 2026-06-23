import Link from "next/link";
import type { Metadata } from "next";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { requireUser, isUserAdmin } from "@/lib/auth";
import { getUserOrders } from "@/lib/orders";
import { getVendorForUser } from "@/lib/vendor";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountDashboard() {
  const user = await requireUser();
  const [orders, vendor] = await Promise.all([
    getUserOrders(user.id),
    getVendorForUser(user.id),
  ]);
  const recent = orders.slice(0, 3);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-steel-900">
        Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""}
      </h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Orders" value={String(orders.length)} href="/account/orders" />
        <Stat
          label="Account"
          value={user.role === "pro" ? "BRC Pro" : "Standard"}
          href="/pro"
        />
        <Stat label="Saved Addresses" value="Manage" href="/account/addresses" />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {vendor ? (
          <Link
            href="/vendor"
            className="rounded-md bg-steel-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-steel-700"
          >
            Seller Dashboard →
          </Link>
        ) : (
          <Link
            href="/sell"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-steel-900 hover:bg-accent-dark"
          >
            Start Selling on BRC
          </Link>
        )}
        {isUserAdmin(user) && (
          <Link
            href="/admin"
            className="rounded-md border border-border bg-white px-5 py-2.5 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
          >
            Admin Panel
          </Link>
        )}
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between border-b-2 border-steel-900 pb-2">
          <h2 className="font-display text-xl font-bold uppercase text-steel-900">
            Recent Orders
          </h2>
          <Link href="/account/orders" className="text-sm font-semibold text-brand hover:underline">
            View all →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 text-steel-500">
            No orders yet.{" "}
            <Link href="/c" className="font-semibold text-brand hover:underline">
              Start shopping
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-white">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/account/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-steel-50"
                >
                  <div>
                    <p className="font-display font-bold text-steel-900">
                      {o.orderNumber}
                    </p>
                    <p className="text-xs text-steel-500">
                      {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                      {o.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-medium text-steel-900">
                      {formatPrice(o.totalCents)}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-border bg-white p-5 transition-all hover:border-brand hover:shadow-md"
    >
      <p className="text-xs uppercase tracking-wide text-steel-500">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-steel-900">
        {value}
      </p>
    </Link>
  );
}
