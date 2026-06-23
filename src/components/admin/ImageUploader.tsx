"use client";

import { useId, useState } from "react";

/**
 * Uploads image files to /api/upload and collects their URLs (you can also
 * paste URLs). Serializes to a newline-separated hidden input so the existing
 * product actions read it unchanged.
 */
export function ImageUploader({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [urls, setUrls] = useState<string[]>(() =>
    defaultValue
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const inputId = useId();

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    setBusy(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Upload failed.");
          continue;
        }
        setUrls((prev) => [...prev, data.url]);
      } catch {
        setError("Upload failed. Please try again.");
      }
    }
    setBusy(false);
  }

  function addUrl() {
    const u = urlInput.trim();
    if (/^https?:\/\//i.test(u)) {
      setUrls((prev) => [...prev, u]);
      setUrlInput("");
    }
  }

  function remove(i: number) {
    setUrls((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
        }}
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-steel-50 px-4 py-6 text-center text-sm text-steel-500 transition-colors hover:border-brand"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
        </svg>
        <span className="mt-1 font-medium text-steel-700">
          {busy ? "Uploading…" : "Drag & drop or click to upload"}
        </span>
        <span className="text-xs">JPG, PNG, WEBP, GIF · up to 5 MB</span>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          className="hidden"
        />
      </label>

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {urls.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="group relative aspect-square overflow-hidden rounded-md border border-border bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-full w-full object-contain" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-steel-900/80 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex gap-2">
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="…or paste an image URL"
          className="w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          type="button"
          onClick={addUrl}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand"
        >
          Add
        </button>
      </div>

      <input type="hidden" name={name} value={urls.join("\n")} />
    </div>
  );
}
