import "server-only";
import { cookies } from "next/headers";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { garageVehicles, productFitment, vehicles } from "@/db/schema";

export const VEHICLE_COOKIE_NAME = "brc_vehicle";

export type VehicleRow = {
  id: string;
  make: string;
  model: string;
  yearStart: number | null;
  yearEnd: number | null;
};

export function formatVehicle(v: {
  make: string;
  model: string;
  yearStart: number | null;
  yearEnd: number | null;
}): string {
  const years = v.yearStart && v.yearEnd ? ` ${v.yearStart}–${v.yearEnd}` : "";
  return `${v.make} ${v.model}${years}`;
}

export async function getAllVehicles(): Promise<VehicleRow[]> {
  return db
    .select({
      id: vehicles.id,
      make: vehicles.make,
      model: vehicles.model,
      yearStart: vehicles.yearStart,
      yearEnd: vehicles.yearEnd,
    })
    .from(vehicles)
    .orderBy(asc(vehicles.make), asc(vehicles.model));
}

export async function getGarage(userId: string) {
  return db
    .select({
      id: garageVehicles.id,
      vehicleId: vehicles.id,
      make: vehicles.make,
      model: vehicles.model,
      yearStart: vehicles.yearStart,
      yearEnd: vehicles.yearEnd,
    })
    .from(garageVehicles)
    .innerJoin(vehicles, eq(garageVehicles.vehicleId, vehicles.id))
    .where(eq(garageVehicles.userId, userId))
    .orderBy(desc(garageVehicles.createdAt));
}

export async function getActiveVehicleId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VEHICLE_COOKIE_NAME)?.value ?? null;
}

export async function getActiveVehicle(): Promise<VehicleRow | null> {
  const id = await getActiveVehicleId();
  if (!id) return null;
  const [v] = await db
    .select({
      id: vehicles.id,
      make: vehicles.make,
      model: vehicles.model,
      yearStart: vehicles.yearStart,
      yearEnd: vehicles.yearEnd,
    })
    .from(vehicles)
    .where(eq(vehicles.id, id));
  return v ?? null;
}

export async function productFitsVehicle(
  productId: string,
  vehicleId: string,
): Promise<boolean> {
  const rows = await db
    .select({ p: productFitment.productId })
    .from(productFitment)
    .where(
      and(
        eq(productFitment.productId, productId),
        eq(productFitment.vehicleId, vehicleId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
