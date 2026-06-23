import Link from "next/link";
import type { Metadata } from "next";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { requireUser } from "@/lib/auth";
import { getUserOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);

  return (
    <div>
      <h1 className="font-display border-b-2 border-steel-900 pb-2 text-3xl font-bold uppercase text-steel-900">
        Orders
      </h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-steel-500">
          You haven&apos;t placed any orders yet.{" "}
          <Link href="/c" className="font-semibold text-brand hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/account/orders/${o.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-white p-4 hover:border-brand hover:shadow-sm"
              >
                <div>
                  <p className="font-display text-lg font-bold text-steel-900">
                    {o.orderNumber}
                  </p>
                  <p className="text-xs text-steel-500">
                    Placed {o.createdAt.toLocaleDateString()} ·{" "}
                    {o.items.length} item{o.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg font-bold text-steel-900">
                    {formatPrice(o.totalCents)}
                  </span>
                  <OrderStatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
