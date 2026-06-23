"use client";

import { useActionState } from "react";
import { updateStoreSettingsAction, type AdminState } from "@/app/actions/admin";

export function StoreSettingsForm({
  taxPercent,
  flatShipping,
  freeShipThreshold,
}: {
  taxPercent: string;
  flatShipping: string;
  freeShipThreshold: string;
}) {
  const [state, formAction, pending] = useActionState<AdminState, FormData>(
    updateStoreSettingsAction,
    {},
  );

  return (
    <form action={formAction} className="grid max-w-xl gap-4 sm:grid-cols-3">
      <Field label="Sales tax (%)">
        <input name="taxPercent" defaultValue={taxPercent} inputMode="decimal" className="ipt" />
      </Field>
      <Field label="Flat shipping ($)">
        <input name="flatShipping" defaultValue={flatShipping} inputMode="decimal" className="ipt" />
      </Field>
      <Field label="Free shipping over ($)">
        <input
          name="freeShipThreshold"
          defaultValue={freeShipThreshold}
          inputMode="decimal"
          className="ipt"
        />
      </Field>

      <div className="sm:col-span-3">
        {state.error && <p className="mb-2 text-sm text-danger">{state.error}</p>}
        {state.ok && <p className="mb-2 text-sm text-success">Settings saved.</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
        >
          {pending ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <style>{`
        .ipt { width:100%; border-radius:0.375rem; border:1px solid var(--color-border); background:#fff; padding:0.5rem 0.625rem; font-size:0.875rem; color:var(--color-steel-900); }
        .ipt:focus { outline:none; box-shadow:0 0 0 2px var(--color-brand); }
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
