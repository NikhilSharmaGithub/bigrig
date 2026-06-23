import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";

export const metadata: Metadata = {
  title: "BRC Pro for Fleets",
  description:
    "BRC Pro gives fleets volume pricing, net terms, and a dedicated parts specialist. Built for owner-operators and shops that buy in bulk.",
};

const PERKS = [
  ["Volume pricing", "Tiered discounts that scale with your order size."],
  ["Net-30 terms", "Buy now, pay later with an approved business line."],
  ["Dedicated specialist", "A real parts pro who knows your equipment."],
  ["Priority fulfillment", "Your orders move to the front of the queue."],
  ["Fleet dashboards", "Track spend, orders, and returns across drivers."],
  ["Bulk quotes", "Fast quotes on large or recurring parts lists."],
];

export default function ProPage() {
  return (
    <PageShell
      title="BRC Pro"
      subtitle="Built for fleets, shops, and owner-operators who buy in volume."
    >
      <p>
        BRC Pro is our membership for businesses that run on parts. Get better
        pricing, flexible terms, and a specialist who treats your uptime like
        their job — because it is.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {PERKS.map(([title, desc]) => (
          <div
            key={title}
            className="rounded-lg border border-border bg-white p-5"
          >
            <p className="font-display font-bold text-steel-900">{title}</p>
            <p className="mt-1 text-sm text-steel-600">{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-steel-900 p-6 text-center text-white">
        <h2 className="text-white">Ready to run with BRC Pro?</h2>
        <p className="mt-1 text-steel-300">
          Create an account, then talk to our team about fleet pricing.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/register"
            className="rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Create Account
          </Link>
          <Link
            href="/contact"
            className="rounded-md border border-steel-600 px-6 py-3 font-semibold text-white hover:bg-steel-800"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
