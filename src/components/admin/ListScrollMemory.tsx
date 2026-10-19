"use client";

import { useEffect } from "react";

const KEY = "admin-products-scroll";

/**
 * Puts the admin back where they were on the product list after editing a
 * product: the exact scroll position when we have it, otherwise the edited row
 * (#p-<id> on the URL) centred on screen. The row is briefly highlighted.
 */
export function ListScrollMemory() {
  useEffect(() => {
    const here = () => window.location.pathname + window.location.search;

    function remember(e: MouseEvent) {
      const link = (e.target as Element | null)?.closest?.("a[data-remember-scroll]");
      if (!link) return;
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ url: here(), y: window.scrollY }));
      } catch {
        // Storage blocked: the #p-<id> anchor still brings the row back into view.
      }
    }
    document.addEventListener("click", remember, true);

    let timer: ReturnType<typeof setTimeout> | undefined;
    const hash = window.location.hash;
    const row = hash.startsWith("#p-") ? document.getElementById(hash.slice(1)) : null;
    if (row) {
      let saved: { url: string; y: number } | null = null;
      try {
        saved = JSON.parse(sessionStorage.getItem(KEY) ?? "null");
        sessionStorage.removeItem(KEY);
      } catch {
        saved = null;
      }
      row.setAttribute("data-flash", "");
      // After Next's own scroll-to-hash, so ours wins.
      timer = setTimeout(() => {
        if (saved && saved.url === here()) window.scrollTo({ top: saved.y, behavior: "instant" });
        else row.scrollIntoView({ block: "center", behavior: "instant" });
        timer = setTimeout(() => row.removeAttribute("data-flash"), 2500);
      }, 50);
    }

    return () => {
      document.removeEventListener("click", remember, true);
      clearTimeout(timer);
    };
  }, []);

  return null;
}
