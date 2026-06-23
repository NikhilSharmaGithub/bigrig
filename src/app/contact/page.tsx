import type { Metadata } from "next";
import { ContactForm } from "@/components/content/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Big Rig Components parts team by phone, email, or message.",
};

export default function ContactPage() {
  return (
    <div>
      <div className="hazard-stripes h-1.5 w-full" />
      <div className="bg-steel-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h1 className="font-display text-4xl font-bold uppercase tracking-wide">
            Contact Us
          </h1>
          <p className="mt-2 text-steel-300">
            Real parts experts, ready to help you find the right part.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-6">
          <InfoCard label="Call us" value={SITE.phone} href={SITE.phoneHref} />
          <InfoCard
            label="Email"
            value={SITE.email}
            href={`mailto:${SITE.email}`}
          />
          <div className="rounded-lg border border-border bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-steel-500">
              Warehouse
            </p>
            <address className="mt-1 not-italic text-steel-800">
              {SITE.address.line1}
              <br />
              {SITE.address.city}, {SITE.address.state}{" "}
              {SITE.address.postalCode}
            </address>
          </div>
          <div className="rounded-lg border border-border bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-steel-500">
              Hours
            </p>
            <p className="mt-1 text-steel-800">
              Mon–Fri, 7am–7pm CT
              <br />
              Sat, 8am–2pm CT
            </p>
          </div>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block rounded-lg border border-border bg-white p-5 transition-all hover:border-brand hover:shadow-md"
    >
      <p className="text-xs uppercase tracking-wide text-steel-500">{label}</p>
      <p className="font-display mt-1 text-xl font-bold text-steel-900">
        {value}
      </p>
    </a>
  );
}
