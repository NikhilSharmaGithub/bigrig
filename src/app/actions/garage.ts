"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { garageVehicles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { VEHICLE_COOKIE_NAME } from "@/lib/garage";

const SIX_MONTHS = 60 * 60 * 24 * 180;

async function setVehicleCookie(vehicleId: string) {
  const store = await cookies();
  store.set(VEHICLE_COOKIE_NAME, vehicleId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SIX_MONTHS,
  });
}

/** Set the active "my truck" (works for guests too). */
export async function setActiveVehicleAction(vehicleId: string): Promise<void> {
  if (vehicleId) await setVehicleCookie(vehicleId);
  revalidatePath("/account/garage");
}

export async function clearActiveVehicleAction(): Promise<void> {
  const store = await cookies();
  store.delete(VEHICLE_COOKIE_NAME);
  revalidatePath("/account/garage");
}

/** Save a vehicle to the user's garage and make it active. */
export async function addGarageVehicleAction(vehicleId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!vehicleId) return;
  await setVehicleCookie(vehicleId);
  try {
    await db.insert(garageVehicles).values({ userId: user.id, vehicleId });
  } catch {
    // already in garage — ignore unique violation
  }
  revalidatePath("/account/garage");
}

export async function removeGarageVehicleAction(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await db
    .delete(garageVehicles)
    .where(and(eq(garageVehicles.id, id), eq(garageVehicles.userId, user.id)));
  revalidatePath("/account/garage");
}
