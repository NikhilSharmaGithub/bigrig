"use client";

import { useState } from "react";

type Img = { id?: string; url: string; alt?: string | null };

export function ProductGallery({
  images,
  name,
}: {
  images: Img[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-white p-8">
        <div className="flex aspect-square items-center justify-center rounded-lg bg-gradient-to-br from-steel-100 to-steel-200 text-steel-400">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
          </svg>
        </div>
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      <div className="flex-1 overflow-hidden rounded-xl border border-border bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt ?? name}
          className="aspect-square w-full rounded-lg object-contain"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 sm:flex-col">
          {images.map((img, i) => (
            <button
              key={img.id ?? img.url}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white p-1 transition-colors ${
                i === active ? "border-brand" : "border-border hover:border-steel-400"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt ?? `${name} thumbnail ${i + 1}`}
                className="h-full w-full object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
