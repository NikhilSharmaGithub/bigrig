import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Shipping speeds, cut-off times, free shipping threshold, and freight details.",
};

export default function ShippingPage() {
  return (
    <PageShell
      title="Shipping"
      subtitle="Fast, reliable delivery that keeps you moving."
    >
      <h2>Processing &amp; cut-off</h2>
      <p>
        In-stock orders placed before 3:00pm CT on a business day typically ship
        the same day. Orders after the cut-off ship the next business day.
      </p>

      <h2>Free shipping</h2>
      <p>
        Ground shipping is free on orders over $99. Orders under $99 ship at a
        flat rate calculated at checkout.
      </p>

      <h2>Delivery estimates</h2>
      <ul>
        <li>Ground: 1–5 business days depending on destination.</li>
        <li>Backordered parts: ship in 3–5 business days, then transit time.</li>
        <li>Expedited options are available at checkout where eligible.</li>
      </ul>

      <h2>Freight &amp; oversized items</h2>
      <p>
        Large items like radiators, leaf springs, and landing gear may ship via
        LTL freight. Freight orders are scheduled for delivery and may require a
        signature.
      </p>

      <h2>Where we ship</h2>
      <p>
        We currently ship within the contiguous United States. Need somewhere
        else? Contact our team for a quote.
      </p>
    </PageShell>
  );
}
