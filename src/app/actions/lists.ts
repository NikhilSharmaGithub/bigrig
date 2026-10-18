"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, shoppingListItems, shoppingLists } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { addItemBySlug, getCart, removeItem } from "@/lib/cart";
import {
  MAX_LIST_NAME,
  MAX_LISTS,
  addProductToList,
  buyLaterList,
  getListSummaries,
  ownedItem,
  ownedList,
  type ListSummary,
} from "@/lib/lists";

export type ListResult = { ok?: boolean; error?: string; needsAuth?: boolean; message?: string };

function cleanName(raw: unknown): string {
  return String(raw ?? "").trim().replace(/\s+/g, " ").slice(0, MAX_LIST_NAME);
}

function refresh() {
  revalidatePath("/account/lists");
  revalidatePath("/cart");
}

/** For the "Add to list" menu: the signed-in user's lists, or needsAuth. */
export async function getMyListsAction(): Promise<{ needsAuth?: boolean; lists?: ListSummary[] }> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };
  return { lists: await getListSummaries(user.id) };
}

/** Adds a product to one of the user's lists, or to a new list when newListName is given. */
export async function addToListAction(
  slug: string,
  listId: string | null,
  quantity = 1,
  newListName?: string,
): Promise<ListResult> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };

  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.isActive, true)),
    columns: { id: true },
  });
  if (!product) return { error: "This part isn't available." };

  let list = listId ? await ownedList(user.id, listId) : null;
  if (!list && newListName !== undefined) {
    const name = cleanName(newListName);
    if (!name) return { error: "Give the new list a name." };
    const summaries = await getListSummaries(user.id);
    if (summaries.length >= MAX_LISTS) return { error: `You can have up to ${MAX_LISTS} lists.` };
    [list] = await db
      .insert(shoppingLists)
      .values({ userId: user.id, name, position: summaries.length })
      .returning();
  }
  if (!list) return { error: "Choose a list." };

  await addProductToList(list.id, product.id, Math.max(1, Math.floor(quantity)));
  refresh();
  return { ok: true, message: `Added to ${list.name}` };
}

export async function createListAction(_prev: ListResult, formData: FormData): Promise<ListResult> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };
  const name = cleanName(formData.get("name"));
  if (!name) return { error: "Give the list a name." };
  const summaries = await getListSummaries(user.id);
  if (summaries.length >= MAX_LISTS) return { error: `You can have up to ${MAX_LISTS} lists.` };
  await db.insert(shoppingLists).values({ userId: user.id, name, position: summaries.length });
  refresh();
  return { ok: true };
}

export async function renameListAction(listId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !(await ownedList(user.id, listId))) return;
  const name = cleanName(formData.get("name"));
  if (!name) return;
  await db.update(shoppingLists).set({ name }).where(eq(shoppingLists.id, listId));
  refresh();
}

export async function deleteListAction(listId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !(await ownedList(user.id, listId))) return;
  await db.delete(shoppingLists).where(eq(shoppingLists.id, listId));
  refresh();
}

export async function setListItemQtyAction(itemId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !(await ownedItem(user.id, itemId))) return;
  const qty = Math.min(999, Math.max(1, Math.floor(Number(formData.get("quantity")) || 1)));
  await db.update(shoppingListItems).set({ quantity: qty }).where(eq(shoppingListItems.id, itemId));
  refresh();
}

export async function removeListItemAction(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !(await ownedItem(user.id, itemId))) return;
  await db.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
  refresh();
}

/** Moves an item to another of the user's lists (quantities merge if it's already there). */
export async function moveListItemAction(itemId: string, formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const item = await ownedItem(user.id, itemId);
  const target = await ownedList(user.id, String(formData.get("toListId") ?? ""));
  if (!item || !target || target.id === item.listId) return;
  await addProductToList(target.id, item.productId, item.quantity);
  await db.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
  refresh();
}

/** Puts a list item in the cart and takes it off the list. */
export async function moveItemToCartAction(itemId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const item = await ownedItem(user.id, itemId);
  if (!item || !item.product.isActive) return;
  await addItemBySlug(item.product.slug, item.quantity);
  await db.delete(shoppingListItems).where(eq(shoppingListItems.id, itemId));
  refresh();
}

/** Moves every available item on a list into the cart. */
export async function moveListToCartAction(listId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !(await ownedList(user.id, listId))) return;
  const items = await db.query.shoppingListItems.findMany({
    where: eq(shoppingListItems.listId, listId),
    with: { product: { columns: { slug: true, isActive: true } } },
  });
  for (const item of items) {
    if (!item.product.isActive) continue;
    await addItemBySlug(item.product.slug, item.quantity);
    await db.delete(shoppingListItems).where(eq(shoppingListItems.id, item.id));
  }
  refresh();
}

/** Cart → "Buy Later": keeps the quantity, takes the line out of the cart. */
export async function saveForLaterAction(productId: string): Promise<ListResult> {
  const user = await getCurrentUser();
  if (!user) return { needsAuth: true };
  const cart = await getCart();
  const line = cart.items.find((i) => i.productId === productId);
  if (!line) return { error: "That part isn't in your cart." };
  const list = await buyLaterList(user.id);
  await addProductToList(list.id, productId, line.quantity);
  await removeItem(productId);
  refresh();
  return { ok: true, message: `Saved to ${list.name}` };
}
