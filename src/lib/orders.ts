import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";

export function generateOrderNumber(): string {
  return "BRC-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function getOrderByNumber(orderNumber: string) {
  return db.query.orders.findFirst({
    where: eq(orders.orderNumber, orderNumber),
    with: { items: true, returns: true },
  });
}

export async function getOrderByIdForUser(id: string, userId: string) {
  return db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.userId, userId)),
    with: { items: true, returns: true },
  });
}

export async function getUserOrders(userId: string) {
  return db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: (o, { desc }) => desc(o.createdAt),
    with: { items: { columns: { id: true, name: true } } },
  });
}

/** Public order tracking — requires the matching email. */
export async function getOrderForTracking(orderNumber: string, email: string) {
  const order = await getOrderByNumber(orderNumber.trim());
  if (!order) return null;
  if (order.email.toLowerCase() !== email.trim().toLowerCase()) return null;
  return order;
}

export type ShippingAddressSnapshot = {
  name?: string | null;
  email?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};
