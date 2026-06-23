import Link from "next/link";
import type { Metadata } from "next";
import { refreshVendorPayoutStatus } from "@/app/actions/vendor";

export const metadata: Metadata = { title: "Payouts Setup" };

export default async function ConnectReturnPage() {
  const enabled = await refreshVendorPayoutStatus();

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Payouts {enabled ? "Enabled" : "Setup"}
      </h1>
      <div
        className={`mt-4 rounded-lg border p-5 ${
          enabled ? "border-success/40 bg-success/10" : "border-accent/40 bg-accent/10"
        }`}
      >
        {enabled ? (
          <p className="text-steel-700">
            ✓ Your Stripe account is connected and payouts are enabled. Your
            share of each sale (after platform commission) will be transferred
            to you automatically.
          </p>
        ) : (
          <p className="text-steel-700">
            Your Stripe onboarding isn&apos;t complete yet. You can resume it any
            time from your dashboard — payouts turn on once Stripe approves your
            account.
          </p>
        )}
      </div>
      <Link
        href="/vendor"
        className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
