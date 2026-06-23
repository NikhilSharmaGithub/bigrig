import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Big Rig Components collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy Policy" subtitle="Last updated June 2026">
      <p>
        This policy explains what information {SITE.name} collects, how we use
        it, and the choices you have. We keep it short and plain.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>Account details you provide (name, email, password).</li>
        <li>Order and shipping information needed to fulfill purchases.</li>
        <li>Basic usage data to keep the site fast and secure.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To process orders, returns, and support requests.</li>
        <li>To operate, secure, and improve the store.</li>
        <li>To communicate about your orders and account.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <p>
        We don&apos;t sell your personal information. Payment details are handled
        by our payment processor and never stored on our servers.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update or delete your account information at any time. For
        privacy requests, contact us at {SITE.email}.
      </p>
    </PageShell>
  );
}
