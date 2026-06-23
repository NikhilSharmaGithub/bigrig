import type { Metadata } from "next";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { requireVendor, getVendorOrderLines } from "@/lib/vendor";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Store Orders" };

export default async function VendorOrdersPage() {
  const { vendor } = await requireVendor();
  const lines = await getVendorOrderLines(vendor.id);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Orders
      </h1>
      <p className="mt-1 text-sm text-steel-500">
        Items from your store across all orders.
      </p>

      {lines.length === 0 ? (
        <p className="mt-6 text-steel-500">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {lines.map((l, i) => (
                <tr key={`${l.orderId}-${i}`} className="hover:bg-steel-50">
                  <td className="px-4 py-3 font-display font-bold text-steel-900">
                    {l.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-steel-700">{l.name}</td>
                  <td className="px-4 py-3 text-steel-600">{l.quantity}</td>
                  <td className="px-4 py-3 font-medium text-steel-900">
                    {formatPrice(l.lineTotalCents)}
                  </td>
                  <td className="px-4 py-3 text-steel-600">
                    {l.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={l.status} />
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
