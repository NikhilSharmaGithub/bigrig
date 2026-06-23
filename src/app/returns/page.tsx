import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";

export const metadata: Metadata = {
  title: "Returns & RMA",
  description: "Our 30-day hassle-free return policy and how to start a return.",
};

export default function ReturnsPolicyPage() {
  return (
    <PageShell
      title="Returns & RMA"
      subtitle="30-day hassle-free returns, backed by manufacturer warranties."
    >
      <h2>The basics</h2>
      <p>
        Most parts can be returned within 30 days of delivery for a refund or
        exchange. Items must be new, unused, and in their original packaging.
      </p>

      <h2>How to start a return</h2>
      <p>
        Sign in, open the order from your{" "}
        <Link href="/account/orders">order history</Link>, and choose{" "}
        <strong>Request a Return</strong>. We&apos;ll issue an RMA number and
        return instructions. You can track the status under{" "}
        <Link href="/account/returns">Returns</Link>.
      </p>

      <h2>Non-returnable items</h2>
      <ul>
        <li>Electrical parts that have been installed.</li>
        <li>Special-order or custom items.</li>
        <li>Items missing original packaging or hardware.</li>
      </ul>

      <h2>Refunds</h2>
      <p>
        Once we receive and inspect your return, refunds are issued to the
        original payment method. Please allow a few business days for it to post.
      </p>

      <p className="text-sm text-steel-500">
        Core charges, freight, and manufacturer-specific terms may apply to some
        items.
      </p>
    </PageShell>
  );
}
