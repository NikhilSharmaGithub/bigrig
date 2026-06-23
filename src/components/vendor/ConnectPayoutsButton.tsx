"use client";

import { useActionState } from "react";
import { connectStripeAction, type VendorState } from "@/app/actions/vendor";

export function ConnectPayoutsButton({ connected }: { connected: boolean }) {
  const [state, formAction, pending] = useActionState<VendorState, FormData>(
    connectStripeAction,
    {},
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-steel-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-steel-700 disabled:bg-steel-400"
      >
        {pending
          ? "Opening Stripe…"
          : connected
            ? "Manage Payout Account"
            : "Connect Payouts (Stripe)"}
      </button>
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
    </form>
  );
}
