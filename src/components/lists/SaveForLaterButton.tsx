"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveForLaterAction } from "@/app/actions/lists";

/** Cart line → the customer's "Buy Later" list. */
export function SaveForLaterButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const [needsAuth, setNeedsAuth] = useState(false);

  if (needsAuth) {
    return (
      <Link href="/login?next=/cart" className="text-sm font-medium text-brand hover:underline">
        Sign in to save for later
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await saveForLaterAction(productId);
          if (res.needsAuth) setNeedsAuth(true);
          else window.dispatchEvent(new Event("cart:updated"));
        })
      }
      className="text-sm font-medium text-steel-500 hover:text-brand disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save for later"}
    </button>
  );
}
