"use client";

import { useEffect, useState } from "react";

export function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const load = () =>
      fetch("/api/cart/summary")
        .then((r) => r.json())
        .then((d) => setCount(d.count ?? 0))
        .catch(() => {});
    load();
    window.addEventListener("cart:updated", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("cart:updated", load);
      window.removeEventListener("focus", load);
    };
  }, []);

  return (
    <span className="absolute -right-0 -top-0 grid h-5 w-5 place-items-center rounded-full bg-brand text-[10px] font-bold">
      {count > 99 ? "99+" : count}
    </span>
  );
}
