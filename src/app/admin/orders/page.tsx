import Link from "next/link";
import type { Metadata } from "next";
import { StatusForm } from "@/components/admin/StatusForm";
import { getAdminOrders } from "@/lib/admin";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Orders" };

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Orders ({orders.length})
      </h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-steel-500">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-steel-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-display font-bold text-brand hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-steel-500">
                      {o.items.length} item{o.items.length === 1 ? "" : "s"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-steel-600">{o.email || "—"}</td>
                  <td className="px-4 py-3 text-steel-600">
                    {o.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-steel-900">
                    {formatPrice(o.totalCents)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusForm
                      action={updateOrderStatusAction}
                      id={o.id}
                      current={o.status}
                      options={ORDER_STATUSES}
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
