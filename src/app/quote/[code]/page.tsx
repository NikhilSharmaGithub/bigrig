import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { effectiveStatus, getQuoteByCode } from "@/lib/quotes";
import { formatPrice } from "@/lib/format";
import { getStoreSettings, shippingFor, taxFor } from "@/lib/settings";
import { AcceptQuoteButton } from "@/components/quotes/AcceptQuoteButton";
import { CopyCodeButton } from "@/components/quotes/CopyCodeButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your Quote",
  robots: { index: false, follow: false },
};

const STATUS: Record<string, { label: string; tone: string; text: string }> = {
  requested: {
    label: "Waiting for our price",
    tone: "bg-accent/20 text-steel-800",
    text: "We're pricing your parts now and will email you when the quote is ready.",
  },
  quoted: { label: "Price ready", tone: "bg-success/15 text-success", text: "" },
  expired: {
    label: "Expired",
    tone: "bg-steel-200 text-steel-700",
    text: "This price has expired. Email us the code and we'll refresh it.",
  },
  accepted: { label: "Paid", tone: "bg-success/15 text-success", text: "Thanks! This quote has been paid." },
  cancelled: { label: "Cancelled", tone: "bg-steel-200 text-steel-700", text: "This quote was cancelled." },
};

/** Hide most of the address: the code alone opens this page. */
function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}${"•".repeat(Math.max(1, user.length - 2))}@${domain}`;
}

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { code } = await params;
  const quote = await getQuoteByCode(code);
  if (!quote) notFound();
  if (quote.code !== code) redirect(`/quote/${quote.code}`);
  const isNew = (await searchParams).new === "1";

  const status = effectiveStatus(quote);
  const s = STATUS[status];
  const priced = status === "quoted" || status === "accepted" || (status === "expired" && quote.quotedTotalCents !== null);
  const total = priced ? (quote.quotedTotalCents ?? quote.listTotalCents) : quote.listTotalCents;
  const settings = await getStoreSettings();
  const shipping = shippingFor(total, settings);
  const tax = taxFor(total, settings.taxBps);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {isNew && (
        <div className="mb-6 rounded-lg border border-success/40 bg-success/10 p-4 text-sm text-steel-800">
          Quote request sent. Share the code below with us if you message or email, and we&apos;ll
          get back to you with a price.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-steel-500">Quote code</p>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-mono text-3xl font-bold tracking-widest text-steel-900">{quote.code}</span>
            <CopyCodeButton code={quote.code} />
          </div>
          <p className="mt-1 text-xs text-steel-500">
            For {quote.name ? `${quote.name} · ` : ""}
            {maskEmail(quote.email)} · requested {quote.createdAt.toDateString()}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${s.tone}`}>{s.label}</span>
      </div>
      {s.text && <p className="mt-3 text-steel-600">{s.text}</p>}
      {quote.adminNote && priced && (
        <p className="mt-3 rounded-md bg-steel-50 px-3 py-2 text-sm text-steel-700">
          <span className="font-semibold">Note from us:</span> {quote.adminNote}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {quote.items.map((item) => {
            const each = priced ? (item.quotedUnitCents ?? item.unitPriceCents) : item.unitPriceCents;
            const cheaper = priced && each < item.unitPriceCents;
            return (
              <li key={item.id} className="flex items-center gap-4 p-4">
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded bg-steel-100">
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="h-full w-full object-contain" />
                  )}
                </div>
                <div className="flex-1">
                  {item.slug ? (
                    <Link href={`/p/${item.slug}`} className="font-medium text-steel-900 hover:text-brand">
                      {item.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-steel-900">{item.name}</span>
                  )}
                  <p className="text-xs text-steel-500">
                    #{item.partNumber} · Qty {item.quantity} ·{" "}
                    {cheaper && <span className="mr-1 line-through">{formatPrice(item.unitPriceCents)}</span>}
                    <span className={cheaper ? "font-semibold text-success" : ""}>{formatPrice(each)}</span> each
                  </p>
                </div>
                <span className="font-display text-lg font-bold text-steel-900">
                  {formatPrice(each * item.quantity)}
                </span>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit rounded-lg border border-border bg-surface p-5 text-sm">
          <dl className="space-y-2">
            {priced && quote.quotedTotalCents !== null && quote.quotedTotalCents < quote.listTotalCents && (
              <div className="flex justify-between text-steel-500">
                <dt>List price</dt>
                <dd className="line-through">{formatPrice(quote.listTotalCents)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-steel-600">{priced ? "Your price" : "List price"}</dt>
              <dd className="font-semibold text-steel-900">{formatPrice(total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel-600">Shipping</dt>
              <dd>{shipping === 0 ? "FREE" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel-600">Est. tax</dt>
              <dd>{settings.taxBps > 0 ? formatPrice(tax) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-display text-lg font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(total + shipping + tax)}</dd>
            </div>
          </dl>
          {status === "quoted" && (
            <div className="mt-4">
              <AcceptQuoteButton code={quote.code} />
              {quote.expiresAt && (
                <p className="mt-2 text-center text-xs text-steel-500">
                  Price good until {quote.expiresAt.toDateString()}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
