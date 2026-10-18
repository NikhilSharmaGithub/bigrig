import type { Metadata } from "next";
import { lookupQuoteAction } from "@/app/actions/quotes";
import { QuoteLookupForm } from "@/components/quotes/QuoteLookupForm";

export const metadata: Metadata = {
  title: "Find Your Quote",
  robots: { index: false, follow: false },
};

export default function QuoteLookupPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="font-display text-3xl font-bold uppercase text-steel-900">Find your quote</h1>
      <p className="mt-2 text-steel-500">
        Enter the quote code you got when you requested a price (it looks like Q-7KD3MP).
      </p>
      <div className="mt-6">
        <QuoteLookupForm action={lookupQuoteAction} label="Open quote" />
      </div>
    </div>
  );
}
