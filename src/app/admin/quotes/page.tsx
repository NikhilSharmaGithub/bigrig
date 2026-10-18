import Link from "next/link";
import type { Metadata } from "next";
import { adminFindQuoteAction } from "@/app/actions/quotes";
import { QuoteLookupForm } from "@/components/quotes/QuoteLookupForm";
import { effectiveStatus, listRecentQuotes } from "@/lib/quotes";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Quotes" };

const TONE: Record<string, string> = {
  requested: "bg-accent/20 text-steel-800",
  quoted: "bg-success/15 text-success",
  accepted: "bg-steel-900 text-white",
  expired: "bg-steel-200 text-steel-600",
  cancelled: "bg-steel-200 text-steel-600",
};

export default async function AdminQuotesPage() {
  const rows = await listRecentQuotes();
  const waiting = rows.filter((r) => r.status === "requested").length;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Quotes {waiting > 0 && <span className="text-brand">({waiting} waiting)</span>}
      </h1>
      <p className="mt-1 text-sm text-steel-500">
        A customer turns their cart into a quote code. Open it, set your price, and send it back.
      </p>

      <div className="mt-4 rounded-lg border border-border bg-white p-4">
        <p className="mb-2 text-sm font-semibold text-steel-700">Got a code from a customer?</p>
        <QuoteLookupForm action={adminFindQuoteAction} label="Open quote" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Parts</th>
              <th className="px-4 py-3">List</th>
              <th className="px-4 py-3">Quoted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-steel-500">
                  No quote requests yet. Customers find &quot;Request a quote&quot; on the cart page.
                </td>
              </tr>
            )}
            {rows.map((q) => {
              const status = effectiveStatus(q);
              return (
                <tr key={q.id} className="hover:bg-steel-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/quotes/${q.id}`} className="font-mono font-semibold text-brand hover:underline">
                      {q.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-steel-900">{q.name ?? "—"}</p>
                    <p className="text-xs text-steel-500">{q.email}</p>
                  </td>
                  <td className="px-4 py-3">{q.itemCount}</td>
                  <td className="px-4 py-3">{formatPrice(q.listTotalCents)}</td>
                  <td className="px-4 py-3">{q.quotedTotalCents !== null ? formatPrice(q.quotedTotalCents) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TONE[status]}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-steel-500">{q.createdAt.toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
