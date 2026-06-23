import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { requireUser } from "@/lib/auth";
import { getOrderByIdForUser, type ShippingAddressSnapshot } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order Details" };

type Props = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;
  const order = await getOrderByIdForUser(id, user.id);
  if (!order) notFound();

  const addr = order.shippingAddress as ShippingAddressSnapshot | null;
  const canReturn = order.status === "paid" || order.status === "delivered";

  return (
    <div>
      <Link
        href="/account/orders"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b-2 border-steel-900 pb-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase text-steel-900">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-steel-500">
            Placed {order.createdAt.toLocaleDateString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <ul className="divide-y divide-border rounded-lg border border-border bg-white">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium text-steel-900">{it.name}</p>
                  <p className="text-xs text-steel-500">
                    #{it.partNumber} · Qty {it.quantity}
                  </p>
                </div>
                <span className="font-medium text-steel-900">
                  {formatPrice(it.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>

          {order.returns.length > 0 && (
            <div className="mt-6 rounded-lg border border-border bg-surface p-4">
              <h2 className="font-display font-bold uppercase text-steel-900">
                Returns
              </h2>
              <ul className="mt-2 space-y-2 text-sm">
                {order.returns.map((r) => (
                  <li key={r.id} className="flex items-center justify-between">
                    <span className="text-steel-700">{r.rmaNumber}</span>
                    <OrderStatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="font-display font-bold uppercase text-steel-900">
              Summary
            </h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotalCents)} />
              <Row
                label="Shipping"
                value={order.shippingCents === 0 ? "FREE" : formatPrice(order.shippingCents)}
              />
              <Row label="Tax" value={formatPrice(order.taxCents)} />
              <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold text-steel-900">
                <span>Total</span>
                <span>{formatPrice(order.totalCents)}</span>
              </div>
            </dl>
          </div>

          {addr && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h2 className="font-display font-bold uppercase text-steel-900">
                Shipping To
              </h2>
              <address className="mt-2 text-sm not-italic text-steel-700">
                {addr.name && <div>{addr.name}</div>}
                {addr.line1 && <div>{addr.line1}</div>}
                {addr.line2 && <div>{addr.line2}</div>}
                <div>
                  {[addr.city, addr.state, addr.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                {addr.country && <div>{addr.country}</div>}
              </address>
            </div>
          )}

          {canReturn && order.returns.length === 0 && (
            <Link
              href={`/account/returns?order=${order.id}`}
              className="block rounded-md border border-border px-4 py-2.5 text-center text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
            >
              Request a Return
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-steel-600">
      <span>{label}</span>
      <span className="font-medium text-steel-900">{value}</span>
    </div>
  );
}
