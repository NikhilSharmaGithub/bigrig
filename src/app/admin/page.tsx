import Link from "next/link";
import type { Metadata } from "next";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { getDashboardData } from "@/lib/dashboard";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default async function AdminDashboard() {
  const d = await getDashboardData();

  const kpis = [
    { label: "Net Revenue", value: formatPrice(d.summary.netCents), href: "/admin/payments", accent: true },
    { label: "Gross Sales", value: formatPrice(d.summary.grossCents), href: "/admin/payments" },
    { label: "Commission", value: formatPrice(d.payout.platformCommissionCents), href: "/admin/payouts" },
    { label: "Owed to Vendors", value: formatPrice(d.payout.totalOwedCents), href: "/admin/payouts" },
    { label: "Paid Orders", value: String(d.summary.paidOrders), href: "/admin/orders" },
    { label: "Products", value: String(d.counts.productCount), href: "/admin/products" },
    { label: "Vendors", value: String(d.counts.vendorCount), href: "/admin/vendors" },
    { label: "Customers", value: String(d.counts.customerCount), href: "/admin/payments" },
  ];

  const maxRev = Math.max(1, ...d.revenueSeries.map((p) => p.total));
  const totalOrders = d.ordersByStatus.reduce((s, r) => s + r.n, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          Dashboard
        </h1>
        <div className="flex gap-2">
          {d.counts.unreadMessages > 0 && (
            <Link href="/admin/messages" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white">
              {d.counts.unreadMessages} new messages
            </Link>
          )}
          {d.summary.pendingOrders > 0 && (
            <Link href="/admin/orders" className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-steel-900">
              {d.summary.pendingOrders} pending
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className={`rounded-lg border bg-white p-4 transition-all hover:shadow-md ${
              k.accent ? "border-brand" : "border-border hover:border-brand"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-steel-500">{k.label}</p>
            <p className={`font-display mt-1 text-2xl font-bold ${k.accent ? "text-brand" : "text-steel-900"}`}>
              {k.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Revenue chart */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-white p-5">
          <h2 className="font-display text-lg font-bold uppercase text-steel-900">
            Revenue — Last 14 Days
          </h2>
          <svg viewBox="0 0 700 220" className="mt-4 w-full" role="img" aria-label="Revenue chart">
            {d.revenueSeries.map((p, i) => {
              const barW = 700 / d.revenueSeries.length;
              const h = Math.round((p.total / maxRev) * 170);
              const x = i * barW;
              const y = 190 - h;
              return (
                <g key={p.day}>
                  <rect
                    x={x + 4}
                    y={y}
                    width={barW - 8}
                    height={Math.max(h, 1)}
                    rx="3"
                    fill="var(--color-brand)"
                    opacity={p.total > 0 ? 1 : 0.25}
                  />
                  {i % 2 === 0 && (
                    <text x={x + barW / 2} y="208" textAnchor="middle" fontSize="10" fill="var(--color-steel-400)">
                      {p.day.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Order status breakdown */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="font-display text-lg font-bold uppercase text-steel-900">
            Orders by Status
          </h2>
          <ul className="mt-4 space-y-2.5">
            {d.ordersByStatus.length === 0 && (
              <li className="text-sm text-steel-500">No orders yet.</li>
            )}
            {d.ordersByStatus.map((s) => {
              const pct = totalOrders > 0 ? Math.round((s.n / totalOrders) * 100) : 0;
              return (
                <li key={s.status}>
                  <div className="flex items-center justify-between text-sm">
                    <OrderStatusBadge status={s.status} />
                    <span className="font-medium text-steel-700">{s.n}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-steel-100">
                    <div className="h-full bg-steel-700" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="font-display text-lg font-bold uppercase text-steel-900">Top Products</h2>
          {d.topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-steel-500">No sales yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {d.topProducts.map((p) => (
                <li key={p.partNumber} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-steel-900">{p.name}</p>
                    <p className="text-xs text-steel-500">{p.units} sold</p>
                  </div>
                  <span className="font-display font-bold text-steel-900">{formatPrice(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top vendors */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="font-display text-lg font-bold uppercase text-steel-900">Top Vendors</h2>
          {d.payout.rows.length === 0 ? (
            <p className="mt-3 text-sm text-steel-500">No vendor sales yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {d.payout.rows.slice(0, 5).map((v) => (
                <li key={v.vendorId} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/store/${v.slug}`} className="truncate text-sm font-medium text-brand hover:underline">
                    {v.storeName}
                  </Link>
                  <span className="font-display font-bold text-steel-900">{formatPrice(v.grossCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Low stock */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="font-display text-lg font-bold uppercase text-steel-900">Low Stock</h2>
          {d.lowStock.length === 0 ? (
            <p className="mt-3 text-sm text-steel-500">Everything is well stocked.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {d.lowStock.map((p) => (
                <li key={p.slug} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/p/${p.slug}`} className="truncate text-sm text-steel-700 hover:text-brand">
                    {p.name}
                  </Link>
                  <span className={`text-sm font-bold ${(p.qty ?? 0) === 0 ? "text-danger" : "text-accent-dark"}`}>
                    {p.qty ?? 0} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="font-display text-lg font-bold uppercase text-steel-900">Recent Orders</h2>
          {d.recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-steel-500">No orders yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {d.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <Link href={`/admin/orders/${o.id}`} className="font-display font-bold text-brand hover:underline">
                      {o.orderNumber}
                    </Link>
                    <p className="truncate text-xs text-steel-500">{o.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-steel-900">{formatPrice(o.totalCents)}</p>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
