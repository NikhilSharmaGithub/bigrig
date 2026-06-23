import Link from "next/link";
import type { Metadata } from "next";
import { CommissionForm } from "@/components/admin/CommissionForm";
import { recordPayoutAction } from "@/app/actions/admin";
import { getPayoutOverview } from "@/lib/payouts";
import { isStripeConfigured } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Payouts" };

export default async function AdminPayoutsPage() {
  const { rows, commissionBps, platformCommissionCents, totalOwedCents, totalPaidCents } =
    await getPayoutOverview();
  const stripeOn = isStripeConfigured();

  const kpis = [
    { label: "Commission Earned", value: formatPrice(platformCommissionCents), accent: true },
    { label: "Owed to Vendors", value: formatPrice(totalOwedCents) },
    { label: "Paid to Vendors", value: formatPrice(totalPaidCents) },
    { label: "Commission Rate", value: `${(commissionBps / 100).toFixed(1)}%` },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Vendor Payouts
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="mt-6 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold uppercase text-steel-900">
          Commission Rate
        </h2>
        <p className="mt-1 text-sm text-steel-500">
          The platform&apos;s cut of each vendor sale. The rest is the
          vendor&apos;s earnings.
        </p>
        <div className="mt-3">
          <CommissionForm currentPercent={commissionBps / 100} />
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-white p-4 text-sm">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ${
            stripeOn ? "bg-success/15 text-success" : "bg-steel-100 text-steel-600"
          }`}
        >
          Stripe Connect {stripeOn ? "Active" : "Not configured"}
        </span>
        <span className="ml-2 text-steel-500">
          {stripeOn
            ? "Connected vendors are paid automatically after each sale."
            : "Add STRIPE_SECRET_KEY to auto-transfer vendor payouts. Until then, record payouts manually below."}
        </span>
      </div>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold uppercase text-steel-900">
          By Vendor
        </h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-steel-500">No vendor sales yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
                <tr>
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Earned</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Owed</th>
                  <th className="px-4 py-3">Payouts</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.vendorId} className="hover:bg-steel-50">
                    <td className="px-4 py-3 font-medium text-steel-900">
                      <Link href={`/store/${r.slug}`} className="text-brand hover:underline">
                        {r.storeName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-steel-600">{formatPrice(r.grossCents)}</td>
                    <td className="px-4 py-3 text-steel-600">{formatPrice(r.commissionCents)}</td>
                    <td className="px-4 py-3 font-medium text-steel-900">{formatPrice(r.earnedCents)}</td>
                    <td className="px-4 py-3 text-steel-600">{formatPrice(r.paidCents)}</td>
                    <td className="px-4 py-3 font-display font-bold text-brand">{formatPrice(r.owedCents)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.payoutsEnabled
                            ? "bg-success/15 text-success"
                            : r.stripeConnected
                              ? "bg-accent/20 text-accent-dark"
                              : "bg-steel-100 text-steel-600"
                        }`}
                      >
                        {r.payoutsEnabled ? "Auto" : r.stripeConnected ? "Pending" : "Manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.owedCents > 0 ? (
                        <form action={recordPayoutAction.bind(null, r.vendorId, r.owedCents)}>
                          <button
                            type="submit"
                            className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-steel-700 hover:border-brand hover:text-brand"
                          >
                            Mark Paid
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-steel-400">Settled</span>
                      )}
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
