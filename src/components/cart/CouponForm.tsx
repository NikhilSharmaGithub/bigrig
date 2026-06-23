"use client";

import { useActionState } from "react";
import {
  applyCouponAction,
  removeCouponAction,
  type CouponState,
} from "@/app/actions/coupon";

export function CouponForm({ appliedCode }: { appliedCode?: string | null }) {
  const [state, formAction, pending] = useActionState<CouponState, FormData>(
    applyCouponAction,
    {},
  );

  if (appliedCode) {
    return (
      <form
        action={removeCouponAction}
        className="flex items-center justify-between rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm"
      >
        <span className="text-steel-700">
          Code <strong className="text-steel-900">{appliedCode}</strong> applied
        </span>
        <button type="submit" className="text-xs font-semibold text-steel-500 hover:text-danger">
          Remove
        </button>
      </form>
    );
  }

  return (
    <div>
      <form action={formAction} className="flex gap-2">
        <input
          name="code"
          placeholder="Promo code"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm uppercase placeholder:normal-case placeholder:text-steel-400 focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-steel-900 px-4 py-2 text-sm font-semibold text-steel-900 hover:bg-steel-900 hover:text-white disabled:opacity-50"
        >
          {pending ? "…" : "Apply"}
        </button>
      </form>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </div>
  );
}
