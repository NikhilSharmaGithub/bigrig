import Link from "next/link";
import type { Metadata } from "next";
import { getOrderByNumber } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order Confirmed" };

type Props = { searchParams: Promise<{ order?: string }> };

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await getOrderByNumber(orderNumber) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="font-display mt-5 text-3xl font-bold uppercase text-steel-900">
        Order Confirmed
      </h1>
      <p className="mt-2 text-steel-600">
        Thanks for your order — we&apos;re getting your parts ready to ship.
      </p>

      {order ? (
        <div className="mt-8 rounded-lg border border-border bg-white p-6 text-left">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-500">
                Order Number
              </p>
              <p className="font-display text-xl font-bold text-steel-900">
                {order.orderNumber}
              </p>
            </div>
            <span className="rounded-full bg-steel-100 px-3 py-1 text-xs font-semibold uppercase text-steel-700">
              {order.status}
            </span>
          </div>

          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between gap-4">
                <span className="text-steel-700">
                  {it.name}{" "}
                  <span className="text-steel-400">× {it.quantity}</span>
                </span>
                <span className="font-medium text-steel-900">
                  {formatPrice(it.lineTotalCents)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatPrice(order.subtotalCents)} />
            <Row
              label="Shipping"
              value={order.shippingCents === 0 ? "FREE" : formatPrice(order.shippingCents)}
            />
            <div className="flex justify-between pt-2 font-display text-lg font-bold text-steel-900">
              <span>Total</span>
              <span>{formatPrice(order.totalCents)}</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="mt-8 rounded-lg border border-border bg-surface p-6 text-steel-600">
          Your payment was received. A confirmation has been sent to your email.
        </p>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/c"
          className="rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Keep Shopping
        </Link>
        {order && (
          <Link
            href={`/track?order=${order.orderNumber}`}
            className="rounded-md border border-border px-6 py-3 font-semibold text-steel-700 hover:border-brand hover:text-brand"
          >
            Track Order
          </Link>
        )}
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
