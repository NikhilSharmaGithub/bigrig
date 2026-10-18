import Link from "next/link";

/** Subcategory pills under a category heading; the current one is highlighted. */
export function SubcategoryChips({
  parentSlug,
  subcategories,
  activeSlug,
}: {
  parentSlug: string;
  subcategories: { slug: string; name: string; count: number }[];
  activeSlug?: string;
}) {
  if (subcategories.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {activeSlug && (
        <Link
          href={`/c/${parentSlug}`}
          className="rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-steel-700 transition-colors hover:border-brand hover:text-brand"
        >
          All
        </Link>
      )}
      {subcategories.map((sub) => {
        const active = sub.slug === activeSlug;
        return (
          <Link
            key={sub.slug}
            href={`/c/${parentSlug}/${sub.slug}`}
            aria-current={active ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand bg-brand text-white"
                : "border-border bg-white text-steel-700 hover:border-brand hover:text-brand"
            }`}
          >
            {sub.name}
            {sub.count > 0 && (
              <span className={`ml-1.5 text-xs ${active ? "text-white/80" : "text-steel-400"}`}>
                {sub.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
