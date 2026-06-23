import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-steel-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link href="/" className="hover:text-brand">
            Home
          </Link>
        </li>
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="text-steel-300">/</span>
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="hover:text-brand">
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-steel-700">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
