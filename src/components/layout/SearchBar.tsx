"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";

type Suggestion = {
  slug: string;
  name: string;
  brand: string;
  partNumber: string;
  priceCents: number;
  imageUrl: string | null;
};

export function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setItems([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          setItems(d.items ?? []);
          setOpen(true);
        })
        .catch(() => {});
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (query) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <form onSubmit={onSubmit} className="flex w-full">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder="Search by part #, name, or brand…"
          className="w-full rounded-l-md border-0 bg-white px-4 py-2.5 text-sm text-steel-900 placeholder:text-steel-400 focus:outline-none focus:ring-2 focus:ring-brand"
          aria-label="Search parts"
          autoComplete="off"
        />
        <button
          type="submit"
          className="flex items-center gap-2 rounded-r-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-border bg-white text-left shadow-2xl">
          {items.map((s) => (
            <Link
              key={s.slug}
              href={`/p/${s.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0 hover:bg-steel-50"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded bg-steel-100">
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-steel-300">∎</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-steel-900">
                  {s.name}
                </span>
                <span className="block truncate text-xs text-steel-500">
                  {s.brand ? `${s.brand} · ` : ""}#{s.partNumber}
                </span>
              </span>
              <span className="font-display text-sm font-bold text-steel-900">
                {formatPrice(s.priceCents)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
