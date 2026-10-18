import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { inventory, products, shoppingListItems, shoppingLists } from "@/db/schema";
import { primaryImageSql } from "@/lib/queries";

/** Every account starts with these two; the customer can add their own. */
export const DEFAULT_LISTS = ["Buy Now", "Buy Later"] as const;
export const BUY_LATER = "Buy Later";
export const MAX_LISTS = 10;
export const MAX_LIST_NAME = 40;

export async function ensureDefaultLists(userId: string): Promise<void> {
  const [existing] = await db
    .select({ id: shoppingLists.id })
    .from(shoppingLists)
    .where(eq(shoppingLists.userId, userId))
    .limit(1);
  if (existing) return;
  await db
    .insert(shoppingLists)
    .values(DEFAULT_LISTS.map((name, position) => ({ userId, name, position })));
}

export type ListSummary = { id: string; name: string; count: number };

export async function getListSummaries(userId: string): Promise<ListSummary[]> {
  await ensureDefaultLists(userId);
  return db
    .select({
      id: shoppingLists.id,
      name: shoppingLists.name,
      count: sql<number>`COUNT(${shoppingListItems.id})::int`,
    })
    .from(shoppingLists)
    .leftJoin(shoppingListItems, eq(shoppingListItems.listId, shoppingLists.id))
    .where(eq(shoppingLists.userId, userId))
    .groupBy(shoppingLists.id)
    .orderBy(asc(shoppingLists.position), asc(shoppingLists.createdAt));
}

export type ListItemView = {
  itemId: string;
  productId: string;
  slug: string;
  name: string;
  partNumber: string;
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
  inStock: boolean;
  isActive: boolean;
};

export type ListView = ListSummary & { items: ListItemView[]; totalCents: number };

export async function getListsWithItems(userId: string): Promise<ListView[]> {
  const lists = await getListSummaries(userId);
  if (lists.length === 0) return [];
  const rows = await db
    .select({
      listId: shoppingListItems.listId,
      itemId: shoppingListItems.id,
      productId: products.id,
      slug: products.slug,
      name: products.name,
      partNumber: products.partNumber,
      priceCents: products.priceCents,
      imageUrl: primaryImageSql,
      quantity: shoppingListItems.quantity,
      qtyOnHand: inventory.quantity,
      isActive: products.isActive,
    })
    .from(shoppingListItems)
    .innerJoin(products, eq(shoppingListItems.productId, products.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .where(inArray(shoppingListItems.listId, lists.map((l) => l.id)))
    .orderBy(asc(shoppingListItems.addedAt));

  return lists.map((list) => {
    const items = rows
      .filter((r) => r.listId === list.id)
      .map((r) => ({
        itemId: r.itemId,
        productId: r.productId,
        slug: r.slug,
        name: r.name,
        partNumber: r.partNumber,
        priceCents: r.priceCents,
        imageUrl: r.imageUrl,
        quantity: r.quantity,
        inStock: (r.qtyOnHand ?? 0) > 0,
        isActive: r.isActive,
      }));
    return {
      ...list,
      items,
      totalCents: items
        .filter((i) => i.isActive)
        .reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    };
  });
}

/** The list if it belongs to this user, else null. */
export async function ownedList(userId: string, listId: string) {
  return db.query.shoppingLists.findFirst({
    where: and(eq(shoppingLists.id, listId), eq(shoppingLists.userId, userId)),
  });
}

/** The list item (with its list) if the list belongs to this user, else null. */
export async function ownedItem(userId: string, itemId: string) {
  const item = await db.query.shoppingListItems.findFirst({
    where: eq(shoppingListItems.id, itemId),
    with: { list: true, product: { columns: { slug: true, isActive: true } } },
  });
  return item && item.list.userId === userId ? item : null;
}

/** Adds a product to a list; if it's already there, the quantities add up. */
export async function addProductToList(listId: string, productId: string, quantity: number) {
  await db
    .insert(shoppingListItems)
    .values({ listId, productId, quantity })
    .onConflictDoUpdate({
      target: [shoppingListItems.listId, shoppingListItems.productId],
      set: { quantity: sql`${shoppingListItems.quantity} + ${quantity}` },
    });
}

/** The user's "Buy Later" list, created if they renamed or deleted it. */
export async function buyLaterList(userId: string) {
  await ensureDefaultLists(userId);
  const found = await db.query.shoppingLists.findFirst({
    where: and(eq(shoppingLists.userId, userId), eq(shoppingLists.name, BUY_LATER)),
  });
  if (found) return found;
  const [created] = await db
    .insert(shoppingLists)
    .values({ userId, name: BUY_LATER, position: 99 })
    .returning();
  return created;
}
