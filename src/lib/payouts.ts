import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { orderItems, orders, products, vendorPayouts, vendors } from "@/db/schema";
import { commissionFor, getCommissionBps } from "@/lib/settings";

const PAID_STATUSES = ["paid", "processing", "shipped", "delivered"] as const;

export type VendorPayoutRow = {
  vendorId: string;
  storeName: string;
  slug: string;
  grossCents: number;
  commissionCents: number;
  earnedCents: number;
  paidCents: number;
  owedCents: number;
  payoutsEnabled: boolean;
  stripeConnected: boolean;
};

export async function getPayoutOverview() {
  const bps = await getCommissionBps();

  const sales = await db
    .select({
      vendorId: products.vendorId,
      gross: sql<number>`COALESCE(SUM(${orderItems.lineTotalCents}), 0)::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        inArray(orders.status, [...PAID_STATUSES]),
        sql`${products.vendorId} IS NOT NULL`,
      ),
    )
    .groupBy(products.vendorId);

  const paid = await db
    .select({
      vendorId: vendorPayouts.vendorId,
      paid: sql<number>`COALESCE(SUM(${vendorPayouts.amountCents}), 0)::int`,
    })
    .from(vendorPayouts)
    .where(eq(vendorPayouts.status, "paid"))
    .groupBy(vendorPayouts.vendorId);
  const paidMap = new Map(paid.map((p) => [p.vendorId, p.paid]));

  const vendorList = await db.select().from(vendors);
  const vendorMap = new Map(vendorList.map((v) => [v.id, v]));

  let platformCommissionCents = 0;
  const rows: VendorPayoutRow[] = sales
    .filter((s) => s.vendorId)
    .map((s) => {
      const v = vendorMap.get(s.vendorId!);
      const commission = commissionFor(s.gross, bps);
      const earned = s.gross - commission;
      const paidOut = paidMap.get(s.vendorId!) ?? 0;
      platformCommissionCents += commission;
      return {
        vendorId: s.vendorId!,
        storeName: v?.storeName ?? "—",
        slug: v?.slug ?? "",
        grossCents: s.gross,
        commissionCents: commission,
        earnedCents: earned,
        paidCents: paidOut,
        owedCents: earned - paidOut,
        payoutsEnabled: v?.payoutsEnabled ?? false,
        stripeConnected: Boolean(v?.stripeAccountId),
      };
    })
    .sort((a, b) => b.owedCents - a.owedCents);

  const totalOwedCents = rows.reduce((s, r) => s + r.owedCents, 0);
  const totalPaidCents = rows.reduce((s, r) => s + r.paidCents, 0);

  return { rows, commissionBps: bps, platformCommissionCents, totalOwedCents, totalPaidCents };
}
