"use client";

import { useState } from "react";

/** Tag-style keyword picker. Serializes to a comma-separated hidden input. */
export function KeywordsInput({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const [tags, setTags] = useState<string[]>(() =>
    defaultValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const [input, setInput] = useState("");

  function add(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (parts.length) {
      setTags((prev) => Array.from(new Set([...prev, ...parts])).slice(0, 20));
    }
    setInput("");
  }

  function remove(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    } else if (e.key === "Backspace" && !input && tags.length) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-white px-2 py-2 focus-within:ring-2 focus-within:ring-brand">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded bg-steel-100 px-2 py-0.5 text-xs font-medium text-steel-700"
          >
            {t}
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-steel-400 hover:text-danger"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => add(input)}
          placeholder={tags.length ? "" : "air brake chamber, type 30, freightliner…"}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-steel-900 focus:outline-none"
        />
      </div>
      <p className="mt-1 text-xs text-steel-400">
        Press Enter or comma to add. These help your product show up in search.
      </p>
      <input type="hidden" name={name} value={tags.join(", ")} />
    </div>
  );
}
