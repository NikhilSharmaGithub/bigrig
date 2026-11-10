"use client";

import { useState } from "react";
import { setBrandLogoAction } from "@/app/actions/admin";
import { BrandLogoUploader } from "@/components/admin/BrandLogoUploader";

/** Admin brands table cell: change a brand's logo and save it right away. */
export function BrandLogoCell({ id, logoUrl }: { id: string; logoUrl: string | null }) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <BrandLogoUploader
        compact
        value={logoUrl}
        onChange={async (url) => {
          const res = await setBrandLogoAction(id, url);
          setError(res.error ?? null);
        }}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
