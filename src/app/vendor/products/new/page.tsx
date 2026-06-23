import Link from "next/link";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { createVendorProductAction } from "@/app/actions/vendor";
import { requireVendor } from "@/lib/vendor";
import { getSelectableCategories } from "@/lib/admin";
import { getAllBrands } from "@/lib/queries";

export const metadata: Metadata = { title: "Add Product" };

export default async function VendorNewProductPage() {
  await requireVendor();
  const [brands, categories] = await Promise.all([
    getAllBrands(),
    getSelectableCategories(),
  ]);

  return (
    <div>
      <Link
        href="/vendor/products"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to my products
      </Link>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-wide text-steel-900">
        Add Product
      </h1>
      <div className="mt-6">
        <ProductForm
          action={createVendorProductAction}
          mode="create"
          brands={brands.map((b) => ({ id: b.id, label: b.name }))}
          categories={categories}
          submitLabel="List Product"
        />
      </div>
    </div>
  );
}
