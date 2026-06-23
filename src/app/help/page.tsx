import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Help Center",
  description: "Answers to common questions about ordering, shipping, fitment, and returns.",
};

const FAQS: [string, React.ReactNode][] = [
  [
    "How do I know a part fits my truck?",
    "Use Shop by Vehicle to filter to parts verified for your make, model, and year. Every product page also lists the trucks it fits.",
  ],
  [
    "When will my order ship?",
    "In-stock parts ordered before 3pm CT typically ship the same business day. Backordered items ship in 3–5 business days.",
  ],
  [
    "How do I track my order?",
    <>
      Head to <Link href="/track">Track Order</Link> and enter your order number
      and the email used at checkout.
    </>,
  ],
  [
    "What is your return policy?",
    <>
      We offer 30-day hassle-free returns on most parts. See our{" "}
      <Link href="/returns">returns policy</Link> for details.
    </>,
  ],
  [
    "Do you offer fleet pricing?",
    <>
      Yes — <Link href="/pro">BRC Pro</Link> gives fleets volume pricing, net
      terms, and a dedicated specialist.
    </>,
  ],
  [
    "Can I order by phone?",
    <>
      Absolutely. Call our parts experts at{" "}
      <a href={SITE.phoneHref}>{SITE.phone}</a>.
    </>,
  ],
];

export default function HelpPage() {
  return (
    <PageShell
      title="Help Center"
      subtitle="Quick answers to the questions we hear most."
    >
      <div className="space-y-3">
        {FAQS.map(([q, a], i) => (
          <details
            key={i}
            className="group rounded-lg border border-border bg-white p-4"
          >
            <summary className="cursor-pointer list-none font-display font-bold text-steel-900">
              {q}
            </summary>
            <div className="mt-2 text-steel-700">{a}</div>
          </details>
        ))}
      </div>

      <p>
        Still stuck? <Link href="/contact">Contact us</Link> and a real person
        will get back to you.
      </p>
    </PageShell>
  );
}
