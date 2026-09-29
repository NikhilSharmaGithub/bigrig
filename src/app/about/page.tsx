import type { Metadata } from "next";
import { PageShell } from "@/components/content/PageShell";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Nova A to Z Parts keeps fleets and owner-operators moving with heavy-duty truck and trailer parts, real-time inventory, and expert support.",
};

export default function AboutPage() {
  return (
    <PageShell
      title="About Nova A to Z Parts"
      subtitle="Parts people who actually know trucks."
    >
      <p>
        Nova A to Z Parts was built around one idea: getting the right part to
        the people who keep freight moving should be fast, honest, and backed by
        folks who know the difference between an air dryer and an air bag.
      </p>

      <h2>What we do</h2>
      <p>
        We stock millions of heavy-duty truck and trailer parts — brakes,
        drivetrain, electrical, cooling, body, and everything in between — from
        the brands fleets already trust. Every part is matched to real fitment
        data so you spend less time guessing and more time rolling.
      </p>

      <h2>Why fleets choose us</h2>
      <ul>
        <li>Real-time inventory from coast-to-coast warehouses.</li>
        <li>Fitment listed by make, model, and year.</li>
        <li>30-day hassle-free returns, backed by manufacturer warranties.</li>
        <li>Volume pricing and net terms for fleets through Nova Pro.</li>
        <li>Parts specialists a phone call away.</li>
      </ul>

      <h2>Our promise</h2>
      <p>
        Downtime costs money. We obsess over accuracy, availability, and speed so
        your truck spends its hours on the road, not in the shop.
      </p>
    </PageShell>
  );
}
