import Link from "next/link";
import type { Metadata } from "next";
import { CartLineControls } from "@/components/cart/CartLineControls";
import { CheckoutButton } from "@/components/cart/CheckoutButton";
import { CouponForm } from "@/components/cart/CouponForm";
import { getCart } from "@/lib/cart";
import { getAppliedCouponCode, getCartDiscount } from "@/lib/coupons";
import { getStoreSettings, shippingFor, taxFor } from "@/lib/settings";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Your Cart" };

export default async function CartPage() {
  const cart = await getCart();
  const discount = await getCartDiscount(cart.subtotalCents);
  const settings = await getStoreSettings();
  const appliedCode =
    discount?.ok ? discount.code : await getAppliedCouponCode();
  const discountCents = discount?.ok ? discount.discountCents : 0;
  const taxableCents = Math.max(0, cart.subtotalCents - discountCents);
  const shippingCents = shippingFor(cart.subtotalCents, settings);
  const taxCents = taxFor(taxableCents, settings.taxBps);
  const FREE_SHIP_THRESHOLD = settings.freeShipThresholdCents;
  const estimatedTotal = taxableCents + shippingCents + taxCents;

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold uppercase text-steel-900">
          Your cart is empty
        </h1>
        <p className="mt-2 text-steel-500">
          Find the parts your rig needs and they&apos;ll show up here.
        </p>
        <Link
          href="/c"
          className="mt-6 inline-block rounded-md bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
        >
          Browse Catalog
        </Link>
      </div>
    );
  }

  const freeShip = cart.subtotalCents >= FREE_SHIP_THRESHOLD;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display border-b-2 border-steel-900 pb-3 text-3xl font-bold uppercase tracking-wide text-steel-900">
        Your Cart ({cart.count})
      </h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Line items */}
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {cart.items.map((item) => (
            <li key={item.productId} className="flex gap-4 p-4">
              <Link
                href={`/p/${item.slug}`}
                className="grid h-20 w-20 shrink-0 place-items-center rounded bg-gradient-to-br from-steel-100 to-steel-200 text-steel-400"
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="12" cy="12" r="9" strokeDasharray="2 2" />
                </svg>
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase text-brand">
                      {item.brand}
                    </span>
                    <Link
                      href={`/p/${item.slug}`}
                      className="block font-medium text-steel-900 hover:text-brand"
                    >
                      {item.name}
                    </Link>
                    <span className="text-xs text-steel-500">
                      #{item.partNumber}
                    </span>
                  </div>
                  <span className="font-display whitespace-nowrap text-lg font-bold text-steel-900">
                    {formatPrice(item.lineTotalCents)}
                  </span>
                </div>
                <div className="mt-auto pt-3">
                  <CartLineControls
                    productId={item.productId}
                    quantity={item.quantity}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <aside className="h-fit rounded-lg border border-border bg-surface p-5">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-steel-900">
            Order Summary
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-steel-600">Subtotal</dt>
              <dd className="font-medium text-steel-900">
                {formatPrice(cart.subtotalCents)}
              </dd>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between">
                <dt className="text-success">Discount ({appliedCode})</dt>
                <dd className="font-medium text-success">
                  −{formatPrice(discountCents)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-steel-600">Shipping</dt>
              <dd className="font-medium text-steel-900">
                {shippingCents === 0 ? "FREE" : formatPrice(shippingCents)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-steel-600">
                Tax{settings.taxBps > 0 ? ` (${(settings.taxBps / 100).toFixed(2)}%)` : ""}
              </dt>
              <dd className="font-medium text-steel-900">
                {settings.taxBps > 0 ? formatPrice(taxCents) : "—"}
              </dd>
            </div>
          </dl>

          {!freeShip && (
            <p className="mt-3 rounded bg-accent/15 px-3 py-2 text-xs text-steel-700">
              Add {formatPrice(FREE_SHIP_THRESHOLD - cart.subtotalCents)} more for
              free shipping.
            </p>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <CouponForm appliedCode={appliedCode} />
          </div>

          <div className="mt-4 flex justify-between border-t border-border pt-4">
            <span className="font-display text-lg font-bold text-steel-900">
              Estimated Total
            </span>
            <span className="font-display text-lg font-bold text-steel-900">
              {formatPrice(estimatedTotal)}
            </span>
          </div>

          <div className="mt-4">
            <CheckoutButton />
          </div>
          <Link
            href="/c"
            className="mt-3 block text-center text-sm font-medium text-brand hover:underline"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
