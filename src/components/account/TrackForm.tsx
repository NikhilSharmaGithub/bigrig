"use client";

import { useActionState } from "react";
import { trackOrderAction, type TrackState } from "@/app/actions/track";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { formatPrice } from "@/lib/format";

export function TrackForm({ defaultOrder }: { defaultOrder?: string }) {
  const [state, formAction, pending] = useActionState<TrackState, FormData>(
    trackOrderAction,
    {},
  );

  return (
    <div>
      <form
        action={formAction}
        className="rounded-lg border border-border bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-steel-700">
              Order number
            </span>
            <input
              name="order"
              defaultValue={defaultOrder}
              placeholder="BRC-XXXXXXXX"
              className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-steel-700">
              Email
            </span>
            <input
              name="email"
              type="email"
              placeholder="you@fleet.com"
              className="w-full rounded-md border border-border bg-white px-3 py-2.5 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </label>
        </div>
        {state.error && (
          <p className="mt-3 text-sm text-danger">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-4 rounded-md bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
        >
          {pending ? "Looking up…" : "Track Order"}
        </button>
      </form>

      {state.order && (
        <div className="mt-6 rounded-lg border border-border bg-white p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-steel-500">
                Order
              </p>
              <p className="font-display text-xl font-bold text-steel-900">
                {state.order.orderNumber}
              </p>
            </div>
            <OrderStatusBadge status={state.order.status} />
          </div>
          <ul className="mt-4 space-y-1.5 text-sm">
            {state.order.items.map((it, i) => (
              <li key={i} className="flex justify-between text-steel-700">
                <span>{it.name}</span>
                <span className="text-steel-400">× {it.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-right font-display text-lg font-bold text-steel-900">
            {formatPrice(state.order.totalCents)}
          </p>
        </div>
      )}
    </div>
  );
}
