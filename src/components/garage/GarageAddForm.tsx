"use client";

import { useMemo, useState, useTransition } from "react";
import { addGarageVehicleAction } from "@/app/actions/garage";
import type { VehicleRow } from "@/lib/garage";

const selectClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand";

export function GarageAddForm({ vehicles }: { vehicles: VehicleRow[] }) {
  const [make, setMake] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [pending, start] = useTransition();

  const makes = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.make))),
    [vehicles],
  );
  const models = useMemo(
    () => vehicles.filter((v) => v.make === make),
    [vehicles, make],
  );

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <select
        value={make}
        onChange={(e) => {
          setMake(e.target.value);
          setVehicleId("");
        }}
        className={selectClass}
      >
        <option value="">Select make…</option>
        {makes.map((m) => (
          <option key={m}>{m}</option>
        ))}
      </select>

      <select
        value={vehicleId}
        onChange={(e) => setVehicleId(e.target.value)}
        disabled={!make}
        className={`${selectClass} disabled:bg-steel-50 disabled:text-steel-400`}
      >
        <option value="">Select model…</option>
        {models.map((v) => (
          <option key={v.id} value={v.id}>
            {v.model}
            {v.yearStart && v.yearEnd ? ` (${v.yearStart}–${v.yearEnd})` : ""}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={!vehicleId || pending}
        onClick={() => start(() => addGarageVehicleAction(vehicleId))}
        className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Adding…" : "Add Truck"}
      </button>
    </div>
  );
}
