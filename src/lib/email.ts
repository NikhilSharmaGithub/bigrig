import "server-only";
import { Resend } from "resend";
import { SITE } from "@/lib/site";
import { formatPrice } from "@/lib/format";

const FROM =
  process.env.RESEND_FROM_EMAIL ?? `${SITE.name} <onboarding@resend.dev>`;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

let client: Resend | null = null;
function getResend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/** Send an email. No-op (and never throws) when Resend isn't configured. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!isEmailConfigured() || !opts.to) return;
  try {
    await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
  } catch (err) {
    console.error("Email send failed:", err);
  }
}

/* -------------------------------------------------------------------------- */
/*  Templates                                                                  */
/* -------------------------------------------------------------------------- */

function shell(bodyHtml: string): string {
  return `
  <div style="background:#f5f6f8;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#16181d;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e2e5ea;">
      <div style="background:#16181d;padding:20px 24px;">
        <span style="font-size:20px;font-weight:bold;letter-spacing:0.5px;color:#fff;">BIG RIG <span style="color:#e4002b;">COMPONENTS</span></span>
        <div style="font-size:10px;letter-spacing:2px;color:#8a909c;text-transform:uppercase;">Heavy-Duty Truck &amp; Trailer Parts</div>
      </div>
      <div style="padding:24px;">${bodyHtml}</div>
      <div style="background:#f5f6f8;padding:16px 24px;font-size:12px;color:#5b616e;border-top:1px solid #e2e5ea;">
        Questions? Email <a href="mailto:${SITE.email}" style="color:#e4002b;">${SITE.email}</a> or call ${SITE.phone}.
      </div>
    </div>
  </div>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#e4002b;color:#fff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:6px;">${label}</a>`;
}

export async function sendWelcomeEmail(to: string, name?: string | null) {
  const body = `
    <h1 style="font-size:22px;margin:0 0 12px;">Welcome${name ? `, ${name}` : ""}!</h1>
    <p style="line-height:1.6;color:#3a3f4b;">Your ${SITE.name} account is ready. Browse millions of heavy-duty truck and trailer parts, fitment-verified for your rig.</p>
    <p style="margin:20px 0;">${button(SITE.url, "Start Shopping")}</p>`;
  await sendEmail({ to, subject: `Welcome to ${SITE.name}`, html: shell(body) });
}

export type OrderEmailData = {
  orderNumber: string;
  email: string;
  items: { name: string; quantity: number; lineTotalCents: number }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
};

export async function sendOrderConfirmationEmail(order: OrderEmailData) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;color:#3a3f4b;">${i.name} × ${i.quantity}</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${formatPrice(i.lineTotalCents)}</td></tr>`,
    )
    .join("");
  const discountRow =
    order.discountCents > 0
      ? `<tr><td style="padding:4px 0;color:#1a8e4b;">Discount</td><td style="padding:4px 0;text-align:right;color:#1a8e4b;">−${formatPrice(order.discountCents)}</td></tr>`
      : "";
  const body = `
    <h1 style="font-size:22px;margin:0 0 4px;">Order confirmed 🎉</h1>
    <p style="color:#5b616e;margin:0 0 16px;">Order <strong>${order.orderNumber}</strong> — we're getting your parts ready to ship.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}
      <tr><td colspan="2" style="border-top:1px solid #e2e5ea;padding-top:8px;"></td></tr>
      <tr><td style="padding:4px 0;color:#5b616e;">Subtotal</td><td style="padding:4px 0;text-align:right;">${formatPrice(order.subtotalCents)}</td></tr>
      ${discountRow}
      <tr><td style="padding:4px 0;color:#5b616e;">Shipping</td><td style="padding:4px 0;text-align:right;">${order.shippingCents === 0 ? "FREE" : formatPrice(order.shippingCents)}</td></tr>
      <tr><td style="padding:8px 0 0;font-size:16px;font-weight:bold;">Total</td><td style="padding:8px 0 0;text-align:right;font-size:16px;font-weight:bold;">${formatPrice(order.totalCents)}</td></tr>
    </table>
    <p style="margin:20px 0;">${button(`${SITE.url}/track?order=${order.orderNumber}`, "Track Order")}</p>`;
  await sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} confirmed`,
    html: shell(body),
  });
}

export async function sendOrderStatusEmail(
  to: string,
  orderNumber: string,
  status: string,
) {
  const body = `
    <h1 style="font-size:22px;margin:0 0 8px;">Order update</h1>
    <p style="line-height:1.6;color:#3a3f4b;">Your order <strong>${orderNumber}</strong> is now <strong style="text-transform:capitalize;">${status}</strong>.</p>
    <p style="margin:20px 0;">${button(`${SITE.url}/track?order=${orderNumber}`, "Track Order")}</p>`;
  await sendEmail({
    to,
    subject: `Order ${orderNumber}: ${status}`,
    html: shell(body),
  });
}
