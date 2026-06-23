import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { and, eq, like, sql } from "drizzle-orm";
import { db } from "./index";
import { orderItems, orders, products } from "./schema";

/**
 * Inserts a few demo paid/refunded orders so the admin Payments dashboard has
 * data to show. Safe to re-run — it clears prior BRC-DEMO* orders first.
 * Delete them anytime: DELETE FROM orders WHERE order_number LIKE 'BRC-DEMO%';
 */
async function main() {
  console.log("⏳ Clearing previous demo orders…");
  await db.delete(orders).where(like(orders.orderNumber, "BRC-DEMO%"));

  // A vendor product (if one exists) + some house products.
  const vendorProduct = await db.query.products.findFirst({
    where: sql`${products.vendorId} IS NOT NULL`,
  });
  const houseProducts = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), sql`${products.vendorId} IS NULL`))
    .limit(5);

  if (houseProducts.length < 3) {
    console.error("Not enough products to seed demo orders. Run db:seed first.");
    process.exit(1);
  }

  type Line = { product: typeof houseProducts[number]; qty: number };
  const demoOrders: {
    number: string;
    email: string;
    status: "paid" | "delivered" | "refunded";
    pi: string;
    lines: Line[];
  }[] = [
    {
      number: "BRC-DEMO001",
      email: "fleet.buyer@example.com",
      status: "paid",
      pi: "pi_demo_Aa1001",
      lines: [
        ...(vendorProduct ? [{ product: vendorProduct, qty: 2 }] : []),
        { product: houseProducts[0], qty: 1 },
      ],
    },
    {
      number: "BRC-DEMO002",
      email: "owner.operator@example.com",
      status: "delivered",
      pi: "pi_demo_Bb2002",
      lines: [
        { product: houseProducts[1], qty: 3 },
        { product: houseProducts[2], qty: 1 },
      ],
    },
    {
      number: "BRC-DEMO003",
      email: "shop.manager@example.com",
      status: "paid",
      pi: "pi_demo_Cc3003",
      lines: [
        { product: houseProducts[0], qty: 4 },
        ...(vendorProduct ? [{ product: vendorProduct, qty: 1 }] : []),
      ],
    },
    {
      number: "BRC-DEMO004",
      email: "returns@example.com",
      status: "refunded",
      pi: "pi_demo_Dd4004",
      lines: [{ product: houseProducts[3] ?? houseProducts[0], qty: 1 }],
    },
  ];

  for (const o of demoOrders) {
    const subtotal = o.lines.reduce(
      (s, l) => s + l.product.priceCents * l.qty,
      0,
    );
    const shipping = subtotal >= 9900 ? 0 : 1500;
    const total = subtotal + shipping;

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: o.number,
        email: o.email,
        status: o.status,
        subtotalCents: subtotal,
        shippingCents: shipping,
        taxCents: 0,
        totalCents: total,
        stripePaymentIntent: o.pi,
        shippingAddress: {
          name: o.email.split("@")[0],
          city: "Dallas",
          state: "TX",
          postalCode: "75201",
          country: "US",
        },
      })
      .returning({ id: orders.id });

    await db.insert(orderItems).values(
      o.lines.map((l) => ({
        orderId: order.id,
        productId: l.product.id,
        name: l.product.name,
        partNumber: l.product.partNumber,
        unitPriceCents: l.product.priceCents,
        quantity: l.qty,
        lineTotalCents: l.product.priceCents * l.qty,
      })),
    );
    console.log(`  ✓ ${o.number} (${o.status}) — $${(total / 100).toFixed(2)}`);
  }

  console.log("✅ Demo orders seeded.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Demo seed failed:", err);
    process.exit(1);
  });
