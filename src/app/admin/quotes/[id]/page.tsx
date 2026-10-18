import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { adminCancelQuoteAction, adminSendQuoteAction } from "@/app/actions/quotes";
import { QuotePriceEditor } from "@/components/quotes/QuotePriceEditor";
import { CopyCodeButton } from "@/components/quotes/CopyCodeButton";
import { QUOTE_VALID_DAYS, effectiveStatus, getQuoteById } from "@/lib/quotes";

export const metadata: Metadata = { title: "Admin · Quote" };

export default async function AdminQuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const quote = await getQuoteById(id);
  if (!quote) notFound();
  const sent = (await searchParams).sent === "1";
  const status = effectiveStatus(quote);
  const locked = status === "accepted" || status === "cancelled";

  return (
    <div>
      <Link href="/admin/quotes" className="text-sm font-medium text-brand hover:underline">
        ← All quotes
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-3xl font-bold tracking-widest text-steel-900">{quote.code}</h1>
        <CopyCodeButton code={quote.code} />
        <span className="rounded-full bg-steel-100 px-3 py-1 text-sm font-semibold capitalize text-steel-700">
          {status}
        </span>
        <Link href={`/quote/${quote.code}`} target="_blank" className="text-sm text-steel-500 hover:text-brand">
          Customer view ↗
        </Link>
      </div>

      {sent && (
        <p className="mt-3 rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          Quote saved and sent. The customer can check out at this price from /quote/{quote.code}.
        </p>
      )}

      <div className="mt-4 grid gap-2 rounded-lg border border-border bg-white p-4 text-sm sm:grid-cols-3">
        <p>
          <span className="text-steel-500">Customer:</span> {quote.name ?? "—"}
        </p>
        <p>
          <span className="text-steel-500">Email:</span>{" "}
          <a href={`mailto:${quote.email}?subject=Your quote ${quote.code}`} className="text-brand hover:underline">
            {quote.email}
          </a>
        </p>
        <p>
          <span className="text-steel-500">Requested:</span> {quote.createdAt.toLocaleString()}
        </p>
        {quote.note && (
          <p className="sm:col-span-3">
            <span className="text-steel-500">Their note:</span> <em>{quote.note}</em>
          </p>
        )}
        {quote.expiresAt && (
          <p className="sm:col-span-3">
            <span className="text-steel-500">Price valid until:</span> {quote.expiresAt.toLocaleString()}
          </p>
        )}
      </div>

      <div className="mt-6">
        <QuotePriceEditor
          lines={quote.items}
          action={adminSendQuoteAction.bind(null, quote.id)}
          defaultValidDays={QUOTE_VALID_DAYS}
          defaultNote={quote.adminNote}
          disabled={locked}
        />
      </div>

      {!locked && (
        <form action={adminCancelQuoteAction.bind(null, quote.id)} className="mt-6">
          <button type="submit" className="text-sm text-steel-500 hover:text-brand">
            Cancel this quote
          </button>
        </form>
      )}
    </div>
  );
}
