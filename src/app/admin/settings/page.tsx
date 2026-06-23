import type { Metadata } from "next";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { getStoreSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Admin · Settings" };

export default async function AdminSettingsPage() {
  const s = await getStoreSettings();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Store Settings
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold uppercase text-steel-900">
          Tax &amp; Shipping
        </h2>
        <p className="mt-1 text-sm text-steel-500">
          Applied to every cart and order. Set tax to 0 to hide it.
        </p>
        <div className="mt-4">
          <StoreSettingsForm
            taxPercent={(s.taxBps / 100).toString()}
            flatShipping={(s.flatShippingCents / 100).toFixed(2)}
            freeShipThreshold={(s.freeShipThresholdCents / 100).toFixed(2)}
          />
        </div>
      </div>

      <p className="mt-4 text-xs text-steel-400">
        Commission rate is managed on the Payouts page.
      </p>
    </div>
  );
}
