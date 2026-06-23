import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the team keeping trucks on the road. Open roles at Big Rig Components.",
};

const ROLES = [
  ["Parts Specialist", "Dallas, TX · Full-time", "Help fleets find the right part, fast."],
  ["Warehouse Associate", "Dallas, TX · Full-time", "Pick, pack, and ship with precision."],
  ["Software Engineer", "Remote · Full-time", "Build the storefront and tools that power the business."],
  ["Fleet Account Manager", "Remote · Full-time", "Own relationships with our BRC Pro fleet customers."],
];

export default function CareersPage() {
  return (
    <PageShell
      title="Careers"
      subtitle="We're a parts company run by people who love trucks. Come build with us."
    >
      <p>
        We&apos;re growing the team that keeps freight moving. If you care about
        doing right by customers and moving fast, we&apos;d love to hear from you.
      </p>

      <h2>Open roles</h2>
      <div className="space-y-3">
        {ROLES.map(([title, meta, desc]) => (
          <div
            key={title}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-5"
          >
            <div>
              <p className="font-display font-bold text-steel-900">{title}</p>
              <p className="text-xs uppercase tracking-wide text-steel-500">
                {meta}
              </p>
              <p className="mt-1 text-sm text-steel-600">{desc}</p>
            </div>
            <Link
              href="/contact"
              className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Apply
            </Link>
          </div>
        ))}
      </div>

      <p className="text-sm text-steel-500">
        Don&apos;t see your role? <Link href="/contact">Reach out anyway.</Link>
      </p>
    </PageShell>
  );
}
