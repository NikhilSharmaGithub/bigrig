"use client";

import { useId, useState } from "react";

/**
 * Upload (or clear) one brand logo. Calls /api/upload, then reports the URL:
 * `onChange` for forms, or serialises it in a hidden input named `name`.
 */
export function BrandLogoUploader({
  name,
  value,
  onChange,
  compact = false,
}: {
  name?: string;
  value?: string | null;
  onChange?: (url: string | null) => void | Promise<void>;
  compact?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(value ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  async function set(next: string | null) {
    setUrl(next);
    await onChange?.(next);
  }

  async function upload(file: File) {
    setError(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Upload failed.");
      else await set(data.url);
    } catch {
      setError("Upload failed. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      {name && <input type="hidden" name={name} value={url ?? ""} />}
      <div
        className={`grid shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-white ${
          compact ? "h-10 w-16" : "h-16 w-24"
        }`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Brand logo" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-[10px] uppercase text-steel-400">No logo</span>
        )}
      </div>
      <div className="text-sm">
        <label
          htmlFor={id}
          className="cursor-pointer font-semibold text-brand hover:underline"
        >
          {busy ? "Uploading…" : url ? "Change" : "Upload logo"}
        </label>
        <input
          id={id}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
        {url && (
          <button
            type="button"
            onClick={() => set(null)}
            className="ml-3 text-steel-500 hover:text-danger"
          >
            Remove
          </button>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </div>
  );
}
