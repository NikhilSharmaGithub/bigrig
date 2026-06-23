"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCouponAction, type AdminState } from "@/app/actions/admin";

export function CouponCreateForm() {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    createCouponAction,
    {},
  );
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      <Field label="Code">
        <input name="code" required placeholder="SAVE10" className="ipt uppercase" />
      </Field>
      <Field label="Type">
        <select name="type" className="ipt" defaultValue="percent">
          <option value="percent">Percent %</option>
          <option value="fixed">Fixed $</option>
        </select>
      </Field>
      <Field label="Value">
        <input name="value" required inputMode="decimal" placeholder="10" className="ipt" />
      </Field>
      <Field label="Min subtotal ($)">
        <input name="minSubtotal" inputMode="decimal" placeholder="0" className="ipt" />
      </Field>
      <Field label="Max uses">
        <input name="maxRedemptions" inputMode="numeric" placeholder="∞" className="ipt" />
      </Field>

      <div className="sm:col-span-2 lg:col-span-5">
        {state.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}
        {state.ok && <p className="mb-2 text-sm text-success">Coupon created.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
        >
          {pending ? "Creating…" : "Create Coupon"}
        </button>
      </div>

      <style>{`
        .ipt { width:100%; border-radius:0.375rem; border:1px solid var(--color-border); background:#fff; padding:0.5rem 0.625rem; font-size:0.875rem; color:var(--color-steel-900); }
        .ipt:focus { outline:none; box-shadow:0 0 0 2px var(--color-brand); }
        .uppercase { text-transform:uppercase; }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-steel-600">{label}</span>
      {children}
    </label>
  );
}
