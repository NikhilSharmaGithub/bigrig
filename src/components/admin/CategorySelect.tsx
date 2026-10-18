"use client";

import { useState, useTransition } from "react";
import { setProductCategoryAction } from "@/app/actions/admin";

type Option = { id: string; label: string };

/** Changes a product's category straight from the admin list. */
export function CategorySelect({
  productId,
  value,
  currentName,
  options,
}: {
  productId: string;
  value: string | null;
  /** Name of the current category, shown when it isn't a subcategory option (a top-level category). */
  currentName?: string | null;
  options: Option[];
}) {
  const [current, setCurrent] = useState(value ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        value={current}
        aria-label="Category"
        onChange={(e) => {
          const next = e.target.value;
          const previous = current;
          setCurrent(next);
          setStatus("saving");
          startTransition(async () => {
            try {
              await setProductCategoryAction(productId, next);
              setStatus("saved");
            } catch {
              setCurrent(previous);
              setStatus("error");
            }
          });
        }}
        className="max-w-[16rem] rounded-md border border-border bg-white px-2 py-1.5 text-xs text-steel-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      >
        <option value="">— No category —</option>
        {value && !options.some((o) => o.id === value) && (
          <option value={value}>{currentName ?? "Current category"} (top level)</option>
        )}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="w-12 text-xs" aria-live="polite">
        {status === "saving" && <span className="text-steel-400">Saving…</span>}
        {status === "saved" && <span className="text-success">Saved ✓</span>}
        {status === "error" && <span className="text-brand">Failed</span>}
      </span>
    </div>
  );
}
