"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/app/actions/wishlist";

type WishlistCtx = {
  count: number;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
};

const Ctx = createContext<WishlistCtx | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [slugs, setSlugs] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => alive && setSlugs(new Set<string>(d.slugs ?? [])))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const toggle = useCallback(
    async (slug: string) => {
      setSlugs((prev) => {
        const next = new Set(prev);
        if (next.has(slug)) next.delete(slug);
        else next.add(slug);
        return next;
      });
      const res = await toggleWishlistAction(slug);
      if (res.needsAuth) {
        router.push("/login");
        return;
      }
      setSlugs((prev) => {
        const next = new Set(prev);
        if (res.wishlisted) next.add(slug);
        else next.delete(slug);
        return next;
      });
    },
    [router],
  );

  return (
    <Ctx.Provider
      value={{ count: slugs.size, has: (s) => slugs.has(s), toggle }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWishlist() {
  return useContext(Ctx);
}
