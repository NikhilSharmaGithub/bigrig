import type { Metadata } from "next";
import { StatusForm } from "@/components/admin/StatusForm";
import { getAdminReturns } from "@/lib/admin";
import { updateReturnStatusAction } from "@/app/actions/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Returns" };

const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "received",
  "refunded",
] as const;

export default async function AdminReturnsPage() {
  const list = await getAdminReturns();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Returns ({list.length})
      </h1>

      {list.length === 0 ? (
        <p className="mt-6 text-steel-500">No return requests.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3">RMA</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-steel-50">
                  <td className="px-4 py-3 font-display font-bold text-steel-900">
                    {r.rmaNumber}
                    {r.refundCents != null && (
                      <p className="text-xs font-normal text-success">
                        Refunded {formatPrice(r.refundCents)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-steel-600">
                    {r.order?.orderNumber ?? "—"}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-steel-600">
                    {r.reason ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-steel-600">
                    {r.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusForm
                      action={updateReturnStatusAction}
                      id={r.id}
                      current={r.status}
                      options={RETURN_STATUSES}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
