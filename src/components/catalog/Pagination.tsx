import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  searchParams,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") sp.set(k, v);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pages || Math.abs(p - page) <= 2,
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-steel-700 hover:border-brand hover:text-brand"
        >
          ← Prev
        </Link>
      )}
      {nums.map((p, idx) => {
        const gap = idx > 0 && p - nums[idx - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1">
            {gap && <span className="px-1 text-steel-400">…</span>}
            <Link
              href={hrefFor(p)}
              aria-current={p === page ? "page" : undefined}
              className={`rounded-md border px-3.5 py-2 text-sm font-medium ${
                p === page
                  ? "border-brand bg-brand text-white"
                  : "border-border text-steel-700 hover:border-brand hover:text-brand"
              }`}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < pages && (
        <Link
          href={hrefFor(page + 1)}
          className="rounded-md border border-border px-3 py-2 text-sm font-medium text-steel-700 hover:border-brand hover:text-brand"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
