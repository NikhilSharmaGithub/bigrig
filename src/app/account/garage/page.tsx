import Link from "next/link";
import type { Metadata } from "next";
import { GarageAddForm } from "@/components/garage/GarageAddForm";
import {
  removeGarageVehicleAction,
  setActiveVehicleAction,
} from "@/app/actions/garage";
import { requireUser } from "@/lib/auth";
import { getActiveVehicleId, getAllVehicles, getGarage, formatVehicle } from "@/lib/garage";

export const metadata: Metadata = { title: "My Garage" };

export default async function GaragePage() {
  const user = await requireUser();
  const [garage, vehicles, activeId] = await Promise.all([
    getGarage(user.id),
    getAllVehicles(),
    getActiveVehicleId(),
  ]);

  return (
    <div>
      <h1 className="font-display border-b-2 border-steel-900 pb-2 text-3xl font-bold uppercase text-steel-900">
        My Garage
      </h1>
      <p className="mt-2 text-steel-500">
        Save your trucks to instantly see which parts fit. We&apos;ll show a{" "}
        <span className="font-semibold text-success">✓ Fits your truck</span>{" "}
        badge across the store.
      </p>

      <div className="mt-5 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-steel-700">
          Add a truck
        </h2>
        <div className="mt-3">
          <GarageAddForm vehicles={vehicles} />
        </div>
      </div>

      <h2 className="font-display mt-8 text-xl font-bold uppercase text-steel-900">
        Your Trucks
      </h2>
      {garage.length === 0 ? (
        <p className="mt-3 text-steel-500">No trucks saved yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {garage.map((v) => {
            const active = v.vehicleId === activeId;
            return (
              <li
                key={v.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 ${
                  active ? "border-brand" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-steel-900 text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M3 13h11V6H3zM14 9h4l3 4v3h-7z" strokeLinejoin="round" />
                      <circle cx="6.5" cy="17" r="1.8" />
                      <circle cx="17.5" cy="17" r="1.8" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-display font-bold text-steel-900">
                      {formatVehicle(v)}
                    </p>
                    {active && (
                      <span className="text-xs font-semibold uppercase text-success">
                        ● Active truck
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/vehicle?make=${encodeURIComponent(v.make)}&vehicle=${v.vehicleId}`}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
                  >
                    Shop parts
                  </Link>
                  {!active && (
                    <form action={setActiveVehicleAction.bind(null, v.vehicleId)}>
                      <button className="rounded-md bg-steel-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-steel-700">
                        Set active
                      </button>
                    </form>
                  )}
                  <form action={removeGarageVehicleAction.bind(null, v.id)}>
                    <button className="text-sm text-steel-500 hover:text-danger">
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
