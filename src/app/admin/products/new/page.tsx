import Link from "next/link";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "@/app/actions/admin";
import { getSelectableCategories } from "@/lib/admin";
import { getAllBrands } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin · New Product" };

export default async function NewProductPage() {
  const [brands, categories] = await Promise.all([
    getAllBrands(),
    getSelectableCategories(),
  ]);

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to products
      </Link>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-wide text-steel-900">
        New Product
      </h1>
      <div className="mt-6">
        <ProductForm
          action={createProductAction}
          mode="create"
          brands={brands.map((b) => ({ id: b.id, label: b.name }))}
          categories={categories}
        />
      </div>
    </div>
  );
}
