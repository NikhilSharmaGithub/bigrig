"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToListAction, getMyListsAction } from "@/app/actions/lists";
import type { ListSummary } from "@/lib/lists";

/** "Add to list" menu on the product page: pick one of your lists or start a new one. */
export function AddToListButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListSummary[] | null>(null);
  const [newName, setNewName] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = () => {
    if (open) return setOpen(false);
    setNote(null);
    startTransition(async () => {
      const res = await getMyListsAction();
      if (res.needsAuth) {
        router.push(`/login?next=${encodeURIComponent(`/p/${slug}`)}`);
        return;
      }
      setLists(res.lists ?? []);
      setOpen(true);
    });
  };

  const add = (listId: string | null, name?: string) =>
    startTransition(async () => {
      const res = await addToListAction(slug, listId, 1, name);
      if (res.needsAuth) {
        router.push(`/login?next=${encodeURIComponent(`/p/${slug}`)}`);
        return;
      }
      setNote(res.ok ? { ok: true, text: `✓ ${res.message}` } : { ok: false, text: res.error ?? "Couldn't add it." });
      if (res.ok) {
        setOpen(false);
        setNewName("");
      }
    });

  return (
    <div ref={box} className="relative mt-3 inline-block">
      <button
        type="button"
        onClick={toggle}
        disabled={pending && !open}
        aria-expanded={open}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
      >
        + Add to list ▾
      </button>
      {note && (
        <span className={`ml-3 text-sm ${note.ok ? "text-success" : "text-brand"}`} aria-live="polite">
          {note.text}
        </span>
      )}
      {open && lists && (
        <div className="absolute left-0 z-30 mt-2 w-64 rounded-lg border border-border bg-white p-2 shadow-xl">
          <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-steel-500">
            Save to list
          </p>
          {lists.map((l) => (
            <button
              key={l.id}
              type="button"
              disabled={pending}
              onClick={() => add(l.id)}
              className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm text-steel-800 hover:bg-steel-50 hover:text-brand"
            >
              <span>{l.name}</span>
              <span className="text-xs text-steel-400">{l.count}</span>
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) add(null, newName);
            }}
            className="mt-1 flex gap-1 border-t border-border pt-2"
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={40}
              placeholder="New list name"
              aria-label="New list name"
              className="min-w-0 flex-1 rounded border border-border px-2 py-1.5 text-sm"
            />
            <button
              type="submit"
              disabled={pending || !newName.trim()}
              className="rounded bg-steel-900 px-3 text-sm font-semibold text-white disabled:bg-steel-300"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
