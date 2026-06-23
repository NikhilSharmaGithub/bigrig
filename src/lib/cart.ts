import "server-only";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { brands, cartItems, carts, inventory, products } from "@/db/schema";
import { getSession } from "@/lib/auth";

const CART_COOKIE = "brc_cart";
const SIXTY_DAYS = 60 * 60 * 24 * 60;

type Owner = { userId: string | null; sessionId: string | null };

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  partNumber: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
  inStock: boolean;
};

export type CartView = {
  id: string | null;
  items: CartLine[];
  subtotalCents: number;
  count: number;
};

/** Owner for read paths — never mutates cookies (safe inside RSC render). */
async function getOwnerReadonly(): Promise<Owner> {
  const session = await getSession();
  if (session) return { userId: session.userId, sessionId: null };
  const store = await cookies();
  return { userId: null, sessionId: store.get(CART_COOKIE)?.value ?? null };
}

/** Owner for write paths — sets a guest cookie if needed (actions/routes only). */
async function getOwnerEnsured(): Promise<Owner> {
  const session = await getSession();
  if (session) return { userId: session.userId, sessionId: null };
  const store = await cookies();
  let sid = store.get(CART_COOKIE)?.value;
  if (!sid) {
    sid = randomUUID();
    store.set(CART_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SIXTY_DAYS,
    });
  }
  return { userId: null, sessionId: sid };
}

async function findCart(owner: Owner) {
  if (owner.userId) {
    return db.query.carts.findFirst({ where: eq(carts.userId, owner.userId) });
  }
  if (owner.sessionId) {
    return db.query.carts.findFirst({
      where: eq(carts.sessionId, owner.sessionId),
    });
  }
  return undefined;
}

async function ensureCart(owner: Owner) {
  const existing = await findCart(owner);
  if (existing) return existing;
  const [created] = await db
    .insert(carts)
    .values({ userId: owner.userId, sessionId: owner.sessionId })
    .returning();
  return created;
}

export async function getCart(): Promise<CartView> {
  const owner = await getOwnerReadonly();
  const cart = await findCart(owner);
  if (!cart) return { id: null, items: [], subtotalCents: 0, count: 0 };

  const rows = await db
    .select({
      productId: products.id,
      slug: products.slug,
      name: products.name,
      brandName: brands.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      quantity: cartItems.quantity,
      qtyOnHand: inventory.quantity,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  const items: CartLine[] = rows.map((r) => ({
    productId: r.productId,
    slug: r.slug,
    name: r.name,
    brand: r.brandName ?? "",
    partNumber: r.partNumber,
    unitPriceCents: r.priceCents,
    quantity: r.quantity,
    lineTotalCents: r.priceCents * r.quantity,
    inStock: (r.qtyOnHand ?? 0) > 0,
  }));

  return {
    id: cart.id,
    items,
    subtotalCents: items.reduce((s, i) => s + i.lineTotalCents, 0),
    count: items.reduce((s, i) => s + i.quantity, 0),
  };
}

export async function getCartCount(): Promise<number> {
  const { count } = await getCart();
  return count;
}

export async function addItemBySlug(slug: string, qty: number): Promise<void> {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    columns: { id: true },
  });
  if (!product) throw new Error("Product not found");

  const cart = await ensureCart(await getOwnerEnsured());
  const existing = await db.query.cartItems.findFirst({
    where: and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, product.id)),
  });

  if (existing) {
    await db
      .update(cartItems)
      .set({ quantity: existing.quantity + qty })
      .where(eq(cartItems.id, existing.id));
  } else {
    await db
      .insert(cartItems)
      .values({ cartId: cart.id, productId: product.id, quantity: qty });
  }
}

export async function setItemQty(
  productId: string,
  qty: number,
): Promise<void> {
  const cart = await findCart(await getOwnerReadonly());
  if (!cart) return;
  if (qty <= 0) {
    await removeItem(productId);
    return;
  }
  await db
    .update(cartItems)
    .set({ quantity: qty })
    .where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
    );
}

export async function removeItem(productId: string): Promise<void> {
  const cart = await findCart(await getOwnerReadonly());
  if (!cart) return;
  await db
    .delete(cartItems)
    .where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
    );
}

export async function clearCart(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}

/** On login/register, fold the guest cookie cart into the user's cart. */
export async function mergeGuestCartIntoUser(userId: string): Promise<void> {
  const store = await cookies();
  const sid = store.get(CART_COOKIE)?.value;
  if (!sid) return;

  const guestCart = await db.query.carts.findFirst({
    where: eq(carts.sessionId, sid),
    with: { items: true },
  });

  if (guestCart && guestCart.items.length > 0) {
    const userCart = await ensureCart({ userId, sessionId: null });
    for (const it of guestCart.items) {
      const existing = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItems.cartId, userCart.id),
          eq(cartItems.productId, it.productId),
        ),
      });
      if (existing) {
        await db
          .update(cartItems)
          .set({ quantity: existing.quantity + it.quantity })
          .where(eq(cartItems.id, existing.id));
      } else {
        await db
          .insert(cartItems)
          .values({
            cartId: userCart.id,
            productId: it.productId,
            quantity: it.quantity,
          });
      }
    }
    await db.delete(carts).where(eq(carts.id, guestCart.id));
  }

  store.delete(CART_COOKIE);
}
