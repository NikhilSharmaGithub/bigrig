"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Homepage hero finder. Picks a make and routes to /vehicle?make=…,
 * where the model/year steps continue against live data.
 */
export function HomeVehicleFinder({ makes }: { makes: string[] }) {
  const router = useRouter();
  const [make, setMake] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(make ? `/vehicle?make=${encodeURIComponent(make)}` : "/vehicle");
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-steel-700 bg-steel-800/60 p-6 backdrop-blur"
    >
      <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
        Find parts for your truck
      </h2>
      <p className="mt-1 text-sm text-steel-400">Filter to parts guaranteed to fit.</p>
      <div className="mt-4 space-y-3">
        <select
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className="w-full rounded-md border-0 bg-white px-3 py-2.5 text-sm text-steel-900 focus:ring-2 focus:ring-brand"
        >
          <option value="">Select Make</option>
          {makes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <select
            disabled
            className="w-full rounded-md border-0 bg-white/70 px-3 py-2.5 text-sm text-steel-400"
          >
            <option>Model</option>
          </select>
          <select
            disabled
            className="w-full rounded-md border-0 bg-white/70 px-3 py-2.5 text-sm text-steel-400"
          >
            <option>Year</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2.5 font-semibold text-steel-900 transition-colors hover:bg-accent-dark"
        >
          Find My Parts
        </button>
      </div>
    </form>
  );
}
