import { count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { vendors } from "@/db/schema";
import { getStripeSetupStatus } from "@/lib/stripe";
import { SITE } from "@/lib/site";

async function vendorPayoutCounts() {
  try {
    const [linked] = await db.select({ n: count() }).from(vendors).where(isNotNull(vendors.stripeAccountId));
    const [ready] = await db.select({ n: count() }).from(vendors).where(eq(vendors.payoutsEnabled, true));
    return { linked: linked.n, ready: ready.n };
  } catch {
    return null;
  }
}

function Row({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex gap-3 py-2">
      <span className={`font-bold ${ok ? "text-success" : "text-brand"}`}>{ok ? "✓" : "✗"}</span>
      <div>
        <p className="font-medium text-steel-900">{label}</p>
        {detail && <p className="text-sm text-steel-500">{detail}</p>}
      </div>
    </li>
  );
}

/** Admin checklist for connecting Stripe (checkout + Connect vendor payouts). */
export async function StripeSetupCard() {
  const [status, payouts] = await Promise.all([getStripeSetupStatus(), vendorPayoutCounts()]);
  const webhookUrl = `${SITE.url}/api/stripe/webhook`;
  const ready = status.keyWorks === true && status.webhookSecretSet;

  return (
    <section className="mt-6 rounded-lg border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold uppercase tracking-wide text-steel-900">
          Stripe setup
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            ready ? "bg-success/15 text-success" : "bg-brand/10 text-brand"
          }`}
        >
          {ready ? `Taking payments${status.mode ? ` · ${status.mode} mode` : ""}` : "Not taking payments yet"}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-border">
        <Row
          ok={status.keyWorks === true}
          label="Secret key (STRIPE_SECRET_KEY)"
          detail={
            !status.keySet
              ? "Not set. Stripe → Developers → API keys → Secret key."
              : status.keyWorks
                ? `Connected to Stripe${status.mode ? ` in ${status.mode} mode` : ""}.`
                : `Stripe rejected the key: ${status.keyError ?? "unknown error"}`
          }
        />
        <Row
          ok={status.webhookSecretSet}
          label="Webhook signing secret (STRIPE_WEBHOOK_SECRET)"
          detail={
            status.webhookSecretSet
              ? "Set. Paid orders are marked paid, stock drops, and vendors are paid out."
              : `Not set. Stripe → Developers → Webhooks → Add endpoint: ${webhookUrl}, event "checkout.session.completed", then copy its signing secret.`
          }
        />
        <Row
          ok={(payouts?.ready ?? 0) > 0}
          label="Stripe Connect (vendor payouts)"
          detail={
            payouts
              ? `${payouts.ready} vendor(s) ready for payouts, ${payouts.linked} started onboarding. Turn on Connect in Stripe (Connect → Get started, Express accounts); vendors then use "Connect payouts" on their dashboard.`
              : "Turn on Connect in Stripe (Connect → Get started, Express accounts); vendors then use \"Connect payouts\" on their dashboard."
          }
        />
      </ul>

      <div className="mt-3 rounded-md bg-steel-50 p-3 text-sm text-steel-600">
        <p className="font-medium text-steel-900">Webhook URL</p>
        <code className="break-all text-steel-900">{webhookUrl}</code>
        <p className="mt-2">
          Add both keys in Vercel → bigrig → Settings → Environment Variables (Production), then
          redeploy. Use test keys (sk_test_…) until a test order works end to end.
        </p>
      </div>
    </section>
  );
}
