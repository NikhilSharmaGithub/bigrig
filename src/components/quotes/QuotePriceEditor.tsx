"use client";

import { startTransition, useActionState, useState } from "react";
import type { QuoteFormState } from "@/app/actions/quotes";

type Line = {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitPriceCents: number;
  quotedUnitCents: number | null;
};

const dollars = (cents: number) => (cents / 100).toFixed(2);
const fmt = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

/** Admin: set the store's price per line (or a % off everything) and send the quote. */
export function QuotePriceEditor({
  lines,
  action,
  defaultValidDays,
  defaultNote,
  disabled,
}: {
  lines: Line[];
  action: (prev: QuoteFormState, data: FormData) => Promise<QuoteFormState>;
  defaultValidDays: number;
  defaultNote: string | null;
  disabled?: boolean;
}) {
  const [state, formAction, pending] = useActionState<QuoteFormState, FormData>(action, {});
  const [prices, setPrices] = useState<Record<string, string>>(() =>
    Object.fromEntries(lines.map((l) => [l.id, dollars(l.quotedUnitCents ?? l.unitPriceCents)])),
  );
  const [pct, setPct] = useState("");

  const listTotal = lines.reduce((s, l) => s + l.unitPriceCents * l.quantity, 0);
  const quotedTotal = lines.reduce((s, l) => {
    const c = Math.round(Number(prices[l.id]) * 100);
    return s + (Number.isFinite(c) && c > 0 ? c : l.unitPriceCents) * l.quantity;
  }, 0);

  const applyPct = () => {
    const p = Number(pct);
    if (!Number.isFinite(p) || p <= 0 || p >= 100) return;
    setPrices(Object.fromEntries(lines.map((l) => [l.id, dollars(Math.round(l.unitPriceCents * (1 - p / 100)))])));
  };

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-steel-50 px-3 py-2 text-sm">
        <span className="font-medium text-steel-700">Quick discount:</span>
        <input
          value={pct}
          onChange={(e) => setPct(e.target.value)}
          inputMode="decimal"
          placeholder="10"
          aria-label="Percent off list price"
          className="w-16 rounded border border-border px-2 py-1"
        />
        <span>% off list</span>
        <button type="button" onClick={applyPct} className="rounded bg-steel-900 px-3 py-1 font-semibold text-white">
          Apply to all
        </button>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-3 py-2">Part</th>
              <th className="px-3 py-2">Qty</th>
              <th className="px-3 py-2">List each</th>
              <th className="px-3 py-2">Your price each</th>
              <th className="px-3 py-2 text-right">Line</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {lines.map((l) => {
              const c = Math.round(Number(prices[l.id]) * 100);
              const each = Number.isFinite(c) && c > 0 ? c : l.unitPriceCents;
              return (
                <tr key={l.id}>
                  <td className="px-3 py-2">
                    <p className="font-medium text-steel-900">{l.name}</p>
                    <p className="text-xs text-steel-500">#{l.partNumber}</p>
                  </td>
                  <td className="px-3 py-2">{l.quantity}</td>
                  <td className="px-3 py-2 text-steel-500">{fmt(l.unitPriceCents)}</td>
                  <td className="px-3 py-2">
                    <span className="mr-1 text-steel-400">$</span>
                    <input
                      name={`price_${l.id}`}
                      value={prices[l.id]}
                      onChange={(e) => setPrices((p) => ({ ...p, [l.id]: e.target.value }))}
                      inputMode="decimal"
                      aria-label={`Price each for ${l.name}`}
                      className="w-24 rounded border border-border px-2 py-1"
                      disabled={disabled}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-medium">{fmt(each * l.quantity)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="font-medium text-steel-700">Valid for (days)</span>
            <input
              name="validDays"
              type="number"
              min={1}
              max={90}
              defaultValue={defaultValidDays}
              className="w-24 rounded border border-border px-2 py-1"
              disabled={disabled}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-medium text-steel-700">Note to customer</span>
            <input
              name="adminNote"
              defaultValue={defaultNote ?? ""}
              maxLength={1000}
              placeholder="e.g. Free freight on this order"
              className="w-80 max-w-full rounded border border-border px-2 py-1"
              disabled={disabled}
            />
          </label>
        </div>
        <div className="text-right">
          <p className="text-sm text-steel-500">
            List {fmt(listTotal)}
            {quotedTotal < listTotal && (
              <span className="ml-2 text-success">−{fmt(listTotal - quotedTotal)}</span>
            )}
          </p>
          <p className="font-display text-2xl font-bold text-steel-900">{fmt(quotedTotal)}</p>
        </div>
      </div>

      {state.error && <p className="mt-2 text-sm text-brand">{state.error}</p>}
      {!disabled && (
        <button
          type="submit"
          disabled={pending}
          className="mt-3 rounded-md bg-brand px-6 py-2.5 font-bold text-white hover:bg-brand-dark disabled:bg-steel-400"
        >
          {pending ? "Sending…" : "Save & send quote"}
        </button>
      )}
    </form>
  );
}
