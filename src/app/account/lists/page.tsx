import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getListsWithItems } from "@/lib/lists";
import { formatPrice } from "@/lib/format";
import {
  deleteListAction,
  moveItemToCartAction,
  moveListItemAction,
  moveListToCartAction,
  removeListItemAction,
  renameListAction,
  setListItemQtyAction,
} from "@/app/actions/lists";
import { CreateListForm } from "@/components/lists/CreateListForm";
import { ConfirmSubmit } from "@/components/lists/ConfirmSubmit";

export const metadata: Metadata = { title: "Shopping Lists" };

export default async function ShoppingListsPage() {
  const user = await requireUser();
  const lists = await getListsWithItems(user.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-steel-900">
        Shopping Lists
      </h1>
      <p className="mt-1 text-sm text-steel-500">
        Keep parts you need now apart from the ones you&apos;ll buy later, or make a list per truck.
        Add parts with <span className="font-medium">+ Add to list</span> on any product page.
      </p>

      <div className="mt-4">
        <CreateListForm />
      </div>

      <div className="mt-6 space-y-6">
        {lists.map((list) => {
          const others = lists.filter((l) => l.id !== list.id);
          return (
            <section key={list.id} className="rounded-lg border border-border bg-white">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-steel-900">{list.name}</h2>
                  <p className="text-xs text-steel-500">
                    {list.items.length} {list.items.length === 1 ? "part" : "parts"}
                    {list.totalCents > 0 && <> · {formatPrice(list.totalCents)}</>}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {list.items.length > 0 && (
                    <form action={moveListToCartAction.bind(null, list.id)}>
                      <button
                        type="submit"
                        className="rounded-md bg-brand px-3 py-1.5 font-semibold text-white hover:bg-brand-dark"
                      >
                        Move all to cart
                      </button>
                    </form>
                  )}
                  <details className="relative">
                    <summary className="cursor-pointer list-none text-steel-500 hover:text-steel-900">
                      Rename
                    </summary>
                    <form
                      action={renameListAction.bind(null, list.id)}
                      className="absolute right-0 z-10 mt-2 flex gap-1 rounded-md border border-border bg-white p-2 shadow-lg"
                    >
                      <input
                        name="name"
                        defaultValue={list.name}
                        maxLength={40}
                        required
                        aria-label="List name"
                        className="w-44 rounded border border-border px-2 py-1 text-sm"
                      />
                      <button type="submit" className="rounded bg-steel-900 px-2 text-sm font-semibold text-white">
                        Save
                      </button>
                    </form>
                  </details>
                  <ConfirmSubmit
                    action={deleteListAction.bind(null, list.id)}
                    message={`Delete the list "${list.name}"${list.items.length ? ` and its ${list.items.length} part(s)` : ""}? This can't be undone.`}
                    label="Delete"
                    className="text-steel-500 hover:text-brand"
                  />
                </div>
              </header>

              {list.items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-steel-500">
                  Nothing here yet. <Link href="/c" className="font-medium text-brand hover:underline">Browse parts</Link>
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {list.items.map((item) => (
                    <li key={item.itemId} className="flex flex-wrap items-center gap-4 px-4 py-3">
                      <Link
                        href={`/p/${item.slug}`}
                        className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded bg-steel-100"
                      >
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                        )}
                      </Link>
                      <div className="min-w-48 flex-1">
                        <Link href={`/p/${item.slug}`} className="font-medium text-steel-900 hover:text-brand">
                          {item.name}
                        </Link>
                        <p className="text-xs text-steel-500">
                          #{item.partNumber} · {formatPrice(item.priceCents)} each
                          {!item.isActive && <span className="ml-1 font-semibold text-brand">· No longer available</span>}
                          {item.isActive && !item.inStock && <span className="ml-1">· Backorder</span>}
                        </p>
                      </div>
                      <form action={setListItemQtyAction.bind(null, item.itemId)} className="flex items-center gap-1">
                        <input
                          name="quantity"
                          type="number"
                          min={1}
                          max={999}
                          defaultValue={item.quantity}
                          aria-label={`Quantity of ${item.name}`}
                          className="w-16 rounded border border-border px-2 py-1 text-sm"
                        />
                        <button type="submit" className="text-xs font-medium text-steel-500 hover:text-brand">
                          Update
                        </button>
                      </form>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        {item.isActive && (
                          <form action={moveItemToCartAction.bind(null, item.itemId)}>
                            <button type="submit" className="font-semibold text-brand hover:underline">
                              Move to cart
                            </button>
                          </form>
                        )}
                        {others.length > 0 && (
                          <form action={moveListItemAction.bind(null, item.itemId)} className="flex items-center gap-1">
                            <select
                              name="toListId"
                              defaultValue=""
                              required
                              aria-label="Move to another list"
                              className="rounded border border-border px-1.5 py-1 text-xs"
                            >
                              <option value="" disabled>
                                Move to…
                              </option>
                              {others.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.name}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className="text-xs font-medium text-steel-600 hover:text-brand">
                              Move
                            </button>
                          </form>
                        )}
                        <form action={removeListItemAction.bind(null, item.itemId)}>
                          <button type="submit" className="text-steel-400 hover:text-brand">
                            Remove
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
