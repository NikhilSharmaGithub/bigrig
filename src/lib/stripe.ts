import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Lazily construct the Stripe client so the app boots without a key set. */
export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local.");
  }
  client = new Stripe(key);
  return client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export type StripeSetupStatus = {
  keySet: boolean;
  mode: "test" | "live" | null;
  keyWorks: boolean | null;
  keyError: string | null;
  webhookSecretSet: boolean;
};

/** What the admin still has to do to take payments (never throws). */
export async function getStripeSetupStatus(): Promise<StripeSetupStatus> {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const mode = /^(sk|rk)_live_/.test(key) ? "live" : /^(sk|rk)_test_/.test(key) ? "test" : null;
  let keyWorks: boolean | null = null;
  let keyError: string | null = null;
  if (key) {
    try {
      await getStripe().balance.retrieve();
      keyWorks = true;
    } catch (err) {
      keyWorks = false;
      keyError = (err as Error).message.slice(0, 160);
    }
  }
  return {
    keySet: Boolean(key),
    mode,
    keyWorks,
    keyError,
    webhookSecretSet: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  };
}
