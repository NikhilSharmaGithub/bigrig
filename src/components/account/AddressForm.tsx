"use client";

import { useActionState, useEffect, useRef } from "react";
import { addAddressAction, type FormState } from "@/app/actions/account";

export function AddressForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    addAddressAction,
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
      className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-white p-5"
    >
      <Input name="fullName" label="Full name *" className="col-span-2" />
      <Input name="line1" label="Address line 1 *" className="col-span-2" />
      <Input name="line2" label="Address line 2" className="col-span-2" />
      <Input name="city" label="City *" />
      <Input name="state" label="State *" />
      <Input name="postalCode" label="ZIP *" />
      <Input name="country" label="Country" defaultValue="US" />
      <Input name="phone" label="Phone" className="col-span-2" />

      {state.error && (
        <p className="col-span-2 text-sm text-danger">{state.error}</p>
      )}
      {state.ok && (
        <p className="col-span-2 text-sm text-success">Address saved.</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="col-span-2 mt-1 rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Saving…" : "Save Address"}
      </button>
    </form>
  );
}

function Input({
  name,
  label,
  className,
  defaultValue,
}: {
  name: string;
  label: string;
  className?: string;
  defaultValue?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-steel-600">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}
