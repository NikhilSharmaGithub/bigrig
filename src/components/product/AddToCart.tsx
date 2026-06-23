"use client";

import { useState, useTransition } from "react";
import { addToCartAction } from "@/app/actions/cart";

export function AddToCart({
  productSlug,
  disabled,
}: {
  productSlug: string;
  disabled?: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      await addToCartAction(productSlug, qty);
      window.dispatchEvent(new Event("cart:updated"));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    });
  }

  return (
    <div className="flex flex-wrap items-stretch gap-3">
      <div className="flex items-center rounded-md border border-border">
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="px-3.5 py-2.5 text-lg text-steel-600 hover:text-brand"
        >
          −
        </button>
        <span className="w-10 text-center font-medium text-steel-900">{qty}</span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => setQty((q) => q + 1)}
          className="px-3.5 py-2.5 text-lg text-steel-600 hover:text-brand"
        >
          +
        </button>
      </div>

      <button
        type="button"
        onClick={add}
        disabled={disabled || pending}
        className="flex-1 rounded-md bg-brand px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-steel-400"
      >
        {disabled
          ? "Out of Stock"
          : pending
            ? "Adding…"
            : added
              ? "✓ Added to Cart"
              : "Add to Cart"}
      </button>
    </div>
  );
}
