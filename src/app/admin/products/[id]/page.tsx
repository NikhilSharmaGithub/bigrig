import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProductAction } from "@/app/actions/admin";
import { getAdminProductById, getSelectableCategories } from "@/lib/admin";
import { getAllBrands } from "@/lib/queries";

export const metadata: Metadata = { title: "Admin · Edit Product" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, brands, categories] = await Promise.all([
    getAdminProductById(id),
    getAllBrands(),
    getSelectableCategories(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm font-medium text-brand hover:underline"
      >
        ← Back to products
      </Link>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-wide text-steel-900">
        Edit Product
      </h1>
      <div className="mt-6">
        <ProductForm
          action={updateProductAction}
          mode="edit"
          brands={brands.map((b) => ({ id: b.id, label: b.name }))}
          categories={categories}
          values={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            partNumber: product.partNumber,
            brandId: product.brandId,
            categoryId: product.categoryId,
            priceDollars: (product.priceCents / 100).toFixed(2),
            listPriceDollars: product.listPriceCents
              ? (product.listPriceCents / 100).toFixed(2)
              : "",
            description: product.description,
            highlights: product.highlights,
            keywords: product.keywords,
            metaTitle: product.metaTitle,
            metaDescription: product.metaDescription,
            isActive: product.isActive,
            qty: product.inventory?.quantity ?? 0,
            images: product.images.map((i) => i.url).join("\n"),
          }}
        />
      </div>
    </div>
  );
}
