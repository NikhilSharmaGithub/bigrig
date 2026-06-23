"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, orders, returns } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateRmaNumber } from "@/lib/account";

export type FormState = { error?: string; ok?: boolean };

function field(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function addAddressAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const fullName = field(formData, "fullName");
  const line1 = field(formData, "line1");
  const city = field(formData, "city");
  const state = field(formData, "state");
  const postalCode = field(formData, "postalCode");

  if (!fullName || !line1 || !city || !state || !postalCode) {
    return { error: "Please fill in all required fields." };
  }

  await db.insert(addresses).values({
    userId: user.id,
    type: "shipping",
    fullName,
    line1,
    line2: field(formData, "line2") || null,
    city,
    state,
    postalCode,
    country: field(formData, "country") || "US",
    phone: field(formData, "phone") || null,
  });

  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddressAction(id: string): Promise<void> {
  const user = await requireUser();
  await db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.userId, user.id)));
  revalidatePath("/account/addresses");
}

export async function requestReturnAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const orderId = field(formData, "orderId");
  const reason = field(formData, "reason");

  if (!orderId) return { error: "Missing order reference." };

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.userId, user.id)),
    columns: { id: true },
  });
  if (!order) return { error: "Order not found." };

  await db.insert(returns).values({
    rmaNumber: generateRmaNumber(),
    orderId,
    userId: user.id,
    status: "requested",
    reason: reason || null,
  });

  redirect("/account/returns");
}
