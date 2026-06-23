import Link from "next/link";
import type { Metadata } from "next";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { requireUser } from "@/lib/auth";
import { getWishlistProducts } from "@/lib/wishlist";

export const metadata: Metadata = { title: "Saved Items" };

export default async function WishlistPage() {
  const user = await requireUser();
  const items = await getWishlistProducts(user.id);

  return (
    <div>
      <h1 className="font-display border-b-2 border-steel-900 pb-2 text-3xl font-bold uppercase text-steel-900">
        Saved Items ({items.length})
      </h1>

      {items.length === 0 ? (
        <p className="mt-6 text-steel-500">
          You haven&apos;t saved anything yet. Tap the{" "}
          <span className="text-brand">♥</span> on any product to save it here.{" "}
          <Link href="/c" className="font-semibold text-brand hover:underline">
            Browse the catalog
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6">
          <ProductGrid items={items} />
        </div>
      )}
    </div>
  );
}
