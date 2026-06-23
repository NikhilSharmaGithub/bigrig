import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";

export const metadata: Metadata = {
  title: "Financing",
  description:
    "Flexible ways to pay for the parts you need — buy now pay later at checkout, or apply for a business line of credit with BRC Pro.",
};

export default function FinancingPage() {
  return (
    <PageShell
      title="Financing"
      subtitle="Keep cash in the business and your truck on the road."
    >
      <p>
        Big repairs shouldn&apos;t stop you cold. We offer flexible ways to pay so
        you can get the parts now and manage cash flow on your terms.
      </p>

      <h2>Pay over time at checkout</h2>
      <p>
        Eligible orders can be split into installments at checkout through our
        buy-now-pay-later partner. Choose your plan during payment — no
        application paperwork for most orders.
      </p>

      <h2>Business line of credit</h2>
      <p>
        Fleets and shops can apply for a business line of credit with net terms
        through <Link href="/pro">BRC Pro</Link>. Consolidate your parts spend,
        pay on a schedule that matches your billing cycle, and give drivers
        approved purchasing.
      </p>

      <h2>How to get started</h2>
      <ul>
        <li>For installments: just look for the option at checkout.</li>
        <li>
          For net terms: <Link href="/register">create an account</Link> and{" "}
          <Link href="/contact">contact our team</Link> to apply.
        </li>
      </ul>

      <p className="text-sm text-steel-500">
        Financing is subject to approval by our third-party partners. Terms and
        availability may vary.
      </p>
    </PageShell>
  );
}
