import "server-only";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { addresses, returns } from "@/db/schema";

export function generateRmaNumber(): string {
  return "RMA-" + randomBytes(4).toString("hex").toUpperCase();
}

export async function getUserAddresses(userId: string) {
  return db.select().from(addresses).where(eq(addresses.userId, userId));
}

export async function getUserReturns(userId: string) {
  return db.query.returns.findMany({
    where: eq(returns.userId, userId),
    orderBy: (r, { desc }) => desc(r.createdAt),
    with: { order: { columns: { orderNumber: true } } },
  });
}
