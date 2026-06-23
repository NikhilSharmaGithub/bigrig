import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StatusForm } from "@/components/admin/StatusForm";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { getAdminOrderById } from "@/lib/admin";
import { updateOrderStatusAction } from "@/app/actions/admin";
import type { ShippingAddressSnapshot } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Order" };

const ORDER_STATUSES = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const addr = order.shippingAddress as ShippingAddressSnapshot | null;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to orders
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase text-steel-900">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-steel-500">
            {order.email} · {order.createdAt.toLocaleString()}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-white p-4">
        <p className="mb-2 text-sm font-medium text-steel-700">Update status</p>
        <StatusForm
          action={updateOrderStatusAction}
          id={order.id}
          current={order.status}
          options={ORDER_STATUSES}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between gap-4 p-4">
              <div>
                <p className="font-medium text-steel-900">{it.name}</p>
                <p className="text-xs text-steel-500">
                  #{it.partNumber} · {formatPrice(it.unitPriceCents)} × {it.quantity}
                </p>
              </div>
              <span className="font-medium text-steel-900">
                {formatPrice(it.lineTotalCents)}
              </span>
            </li>
          ))}
        </ul>

        <aside className="space-y-6">
          <div className="rounded-lg border border-border bg-surface p-5 text-sm">
            <h2 className="font-display font-bold uppercase text-steel-900">
              Totals
            </h2>
            <dl className="mt-3 space-y-1.5">
              <Row label="Subtotal" value={formatPrice(order.subtotalCents)} />
              <Row label="Shipping" value={formatPrice(order.shippingCents)} />
              <Row label="Tax" value={formatPrice(order.taxCents)} />
              <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold text-steel-900">
                <span>Total</span>
                <span>{formatPrice(order.totalCents)}</span>
              </div>
            </dl>
          </div>

          {addr && (
            <div className="rounded-lg border border-border bg-surface p-5 text-sm">
              <h2 className="font-display font-bold uppercase text-steel-900">
                Ship To
              </h2>
              <address className="mt-2 not-italic text-steel-700">
                {addr.name && <div>{addr.name}</div>}
                {addr.line1 && <div>{addr.line1}</div>}
                {addr.line2 && <div>{addr.line2}</div>}
                <div>
                  {[addr.city, addr.state, addr.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </address>
            </div>
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
