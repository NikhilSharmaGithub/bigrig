import type { Metadata } from "next";
import { BulkUploadPanel } from "@/components/admin/BulkUploadPanel";
import { requireAdmin } from "@/lib/auth";
import { productSheetAction } from "@/app/actions/product-sheet";

export const metadata: Metadata = { title: "Admin · Bulk Upload" };
// Large imports run inside this page's server action.
export const maxDuration = 300;

export default async function ImportProductsPage() {
  await requireAdmin();
  return (
    <BulkUploadPanel sheetHref="/admin/products/sheet" productsHref="/admin/products" action={productSheetAction} />
  );
}
