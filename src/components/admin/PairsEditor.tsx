"use client";

import { useState } from "react";

export type PairRow = { a: string; b: string };

const inputClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-steel-900 placeholder:text-steel-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand";

/**
 * Editable two-column table (e.g. spec name → value). Submits its rows as a
 * JSON string in a hidden input named `name`.
 */
export function PairsEditor({
  name,
  defaultRows,
  labelA,
  labelB,
  placeholderA,
  placeholderB,
  addLabel,
}: {
  name: string;
  defaultRows: PairRow[];
  labelA: string;
  labelB: string;
  placeholderA?: string;
  placeholderB?: string;
  addLabel: string;
}) {
  const [rows, setRows] = useState<PairRow[]>(defaultRows);

  const update = (i: number, key: "a" | "b", value: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.length > 0 && (
        <div className="grid grid-cols-[1fr_1.4fr_auto] gap-2 text-xs font-semibold uppercase tracking-wide text-steel-500">
          <span>{labelA}</span>
          <span>{labelB}</span>
          <span className="w-9" />
        </div>
      )}
      <div className="mt-1 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1.4fr_auto] gap-2">
            <input
              value={row.a}
              onChange={(e) => update(i, "a", e.target.value)}
              placeholder={placeholderA}
              aria-label={labelA}
              className={inputClass}
            />
            <input
              value={row.b}
              onChange={(e) => update(i, "b", e.target.value)}
              placeholder={placeholderB}
              aria-label={labelB}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
              aria-label="Remove row"
              className="w-9 rounded-md border border-border text-steel-500 hover:border-danger hover:text-danger"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((r) => [...r, { a: "", b: "" }])}
        className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
      >
        + {addLabel}
      </button>
    </div>
  );
}
