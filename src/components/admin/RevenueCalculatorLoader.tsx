"use client";

import dynamic from "next/dynamic";

// Client-only: the calculator restores a saved session from localStorage on its
// first render, which would differ from server-rendered HTML.
export const RevenueCalculatorLoader = dynamic(
  () => import("@/components/admin/RevenueCalculator").then((m) => m.RevenueCalculator),
  { ssr: false, loading: () => <p className="text-sm text-steel-500">Loading calculator…</p> },
);
