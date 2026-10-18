"use client";

import { useState } from "react";

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard blocked: the code is on screen to copy by hand */
        }
      }}
      className="rounded-md border border-border bg-white px-3 py-1.5 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
    >
      {copied ? "Copied ✓" : "Copy code"}
    </button>
  );
}
