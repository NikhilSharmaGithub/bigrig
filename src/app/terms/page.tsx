import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Big Rig Components.",
};

export default function TermsPage() {
  return (
    <PageShell title="Terms of Service" subtitle="Last updated June 2026">
      <p>
        By using {SITE.name}, you agree to these terms. Please read them. If you
        don&apos;t agree, please don&apos;t use the site.
      </p>

      <h2>Orders &amp; pricing</h2>
      <p>
        We work hard to keep pricing and availability accurate, but errors can
        happen. We reserve the right to correct errors and to cancel orders
        affected by them, with a full refund.
      </p>

      <h2>Fitment</h2>
      <p>
        Fitment data is provided to help you choose the right part, but you are
        responsible for confirming compatibility for your specific application.
      </p>

      <h2>Accounts</h2>
      <p>
        You&apos;re responsible for keeping your account credentials secure and
        for activity under your account.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent permitted by law, {SITE.name} is not liable for indirect or
        consequential damages arising from use of the site or products purchased.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms? Email {SITE.email}.</p>
    </PageShell>
  );
}
