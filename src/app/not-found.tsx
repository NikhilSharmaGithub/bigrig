import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-brand">404</p>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase text-steel-900">
        Part Not Found
      </h1>
      <p className="mt-2 text-steel-500">
        We looked under the hood — this page isn&apos;t here. Let&apos;s get you
        back on the road.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Go Home
        </Link>
        <Link
          href="/c"
          className="rounded-md border border-border px-6 py-3 font-semibold text-steel-700 hover:border-brand hover:text-brand"
        >
          Browse Catalog
        </Link>
      </div>
    </div>
  );
}
