import Link from "next/link";
import type { Metadata } from "next";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import {
  getRecentPayments,
  getRevenueSummary,
  getSalesByVendor,
  getStripeBalance,
} from "@/lib/payments";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Payments" };

export default async function AdminPaymentsPage() {
  const [summary, byVendor, payments, balance] = await Promise.all([
    getRevenueSummary(),
    getSalesByVendor(),
    getRecentPayments(),
    getStripeBalance(),
  ]);

  const totalVendorRevenue = byVendor.reduce((s, v) => s + v.revenueCents, 0);

  const kpis = [
    { label: "Net Revenue", value: formatPrice(summary.netCents), accent: true },
    { label: "Gross Sales", value: formatPrice(summary.grossCents) },
    { label: "Refunds", value: formatPrice(summary.refundedCents) },
    { label: "Paid Orders", value: String(summary.paidOrders) },
    { label: "Avg Order", value: formatPrice(summary.avgOrderCents) },
    { label: "Pending", value: String(summary.pendingOrders) },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Payments &amp; Sales
      </h1>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={`rounded-lg border bg-white p-4 ${
              k.accent ? "border-brand" : "border-border"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-steel-500">
              {k.label}
            </p>
            <p
              className={`font-display mt-1 text-2xl font-bold ${
                k.accent ? "text-brand" : "text-steel-900"
              }`}
            >
              {k.value}
            </p>
          </div>
        ))}
      </div>

      {/* Stripe status */}
      <div className="mt-6 rounded-lg border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase text-steel-900">
            Stripe
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
              balance ? "bg-success/15 text-success" : "bg-steel-100 text-steel-600"
            }`}
          >
            {balance ? "Connected" : "Not connected"}
          </span>
        </div>
        {balance ? (
          <div className="mt-3 grid grid-cols-2 gap-4 sm:max-w-md">
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-500">
                Available balance
              </p>
              <p className="font-display text-xl font-bold text-steel-900">
                {formatPrice(balance.availableCents)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-500">
                Pending payout
              </p>
              <p className="font-display text-xl font-bold text-steel-900">
                {formatPrice(balance.pendingCents)}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-steel-500">
            Add <code className="rounded bg-steel-100 px-1">STRIPE_SECRET_KEY</code>{" "}
            to show your live Stripe balance and payouts here. Sales figures above
            come from completed orders in your database.
          </p>
        )}
      </div>

      {/* Sales by vendor */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold uppercase text-steel-900">
          Sales by Vendor
        </h2>
        {byVendor.length === 0 ? (
          <p className="mt-3 text-steel-500">No sales yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Units</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byVendor.map((v) => {
                  const share =
                    totalVendorRevenue > 0
                      ? Math.round((v.revenueCents / totalVendorRevenue) * 100)
                      : 0;
                  return (
                    <tr key={v.vendorId ?? "house"} className="hover:bg-steel-50">
                      <td className="px-4 py-3 font-medium text-steel-900">
                        {v.slug ? (
                          <Link
                            href={`/store/${v.slug}`}
                            className="text-brand hover:underline"
                          >
                            {v.name}
                          </Link>
                        ) : (
                          v.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-steel-600">{v.units}</td>
                      <td className="px-4 py-3 font-medium text-steel-900">
                        {formatPrice(v.revenueCents)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-steel-100">
                            <div
                              className="h-full bg-brand"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-xs text-steel-500">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent payments */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-bold uppercase text-steel-900">
          Recent Payments
        </h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-steel-500">No payments yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-steel-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${p.id}`}
                        className="font-display font-bold text-brand hover:underline"
                      >
                        {p.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-steel-600">{p.email || "—"}</td>
                    <td className="px-4 py-3 font-medium text-steel-900">
                      {formatPrice(p.totalCents)}
                    </td>
                    <td className="px-4 py-3 text-steel-600">
                      {p.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-steel-400">
                      {p.paymentIntent ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
