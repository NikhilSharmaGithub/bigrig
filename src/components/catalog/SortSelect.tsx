"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/lib/types";

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("sort") ?? "relevance";

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    if (e.target.value === "relevance") next.delete("sort");
    else next.set("sort", e.target.value);
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <label className="flex items-center gap-2 text-sm text-steel-600">
      <span className="hidden sm:inline">Sort:</span>
      <select
        value={current}
        onChange={onChange}
        className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
