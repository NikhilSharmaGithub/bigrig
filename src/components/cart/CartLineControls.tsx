"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  removeCartItemAction,
  updateCartItemAction,
} from "@/app/actions/cart";

export function CartLineControls({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function update(qty: number) {
    startTransition(async () => {
      await updateCartItemAction(productId, qty);
      window.dispatchEvent(new Event("cart:updated"));
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await removeCartItemAction(productId);
      window.dispatchEvent(new Event("cart:updated"));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex items-center rounded-md border border-border ${pending ? "opacity-50" : ""}`}
      >
        <button
          type="button"
          aria-label="Decrease quantity"
          onClick={() => update(quantity - 1)}
          disabled={pending}
          className="px-3 py-1.5 text-steel-600 hover:text-brand"
        >
          −
        </button>
        <span className="w-9 text-center text-sm font-medium text-steel-900">
          {quantity}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          onClick={() => update(quantity + 1)}
          disabled={pending}
          className="px-3 py-1.5 text-steel-600 hover:text-brand"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        className="text-sm text-steel-500 hover:text-danger"
      >
        Remove
      </button>
    </div>
  );
}
