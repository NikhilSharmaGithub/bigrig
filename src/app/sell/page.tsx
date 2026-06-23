import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { BecomeVendorForm } from "@/components/vendor/BecomeVendorForm";
import { getCurrentUser } from "@/lib/auth";
import { getVendorForUser } from "@/lib/vendor";

export const metadata: Metadata = {
  title: "Sell on Big Rig Components",
  description: "Open a store and sell heavy-duty truck and trailer parts to fleets nationwide.",
};

const PERKS = [
  ["Reach buyers", "Get your parts in front of fleets and owner-operators."],
  ["Easy listings", "Add products, set stock and prices, and you're live."],
  ["Your own storefront", "A branded store page customers can browse."],
  ["Track sales", "See orders and revenue from your dashboard."],
];

export default async function SellPage() {
  const user = await getCurrentUser();
  if (user) {
    const vendor = await getVendorForUser(user.id);
    if (vendor) redirect("/vendor");
  }

  return (
    <div>
      <div className="hazard-stripes h-1.5 w-full" />
      <div className="bg-steel-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide">
            Sell on Big Rig Components
          </h1>
          <p className="mt-2 max-w-2xl text-steel-300">
            Turn your parts inventory into sales. Open a store in minutes and
            start listing.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {PERKS.map(([title, desc]) => (
            <div key={title} className="rounded-lg border border-border bg-white p-5">
              <p className="font-display font-bold text-steel-900">{title}</p>
              <p className="mt-1 text-sm text-steel-600">{desc}</p>
            </div>
          ))}
        </div>

        <div>
          {user ? (
            <BecomeVendorForm />
          ) : (
            <div className="rounded-xl border border-border bg-white p-6 text-center">
              <p className="font-display text-lg font-bold text-steel-900">
                Sign in to start selling
              </p>
              <p className="mt-1 text-sm text-steel-600">
                Create an account or sign in, then open your store.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  href="/register"
                  className="rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="rounded-md border border-border px-5 py-2.5 font-semibold text-steel-700 hover:border-brand hover:text-brand"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
