import type { Metadata } from "next";
import { BulkUploadPanel } from "@/components/admin/BulkUploadPanel";
import { requireVendor } from "@/lib/vendor";
import { vendorProductSheetAction } from "@/app/actions/product-sheet";

export const metadata: Metadata = { title: "Bulk Upload" };
// Large imports run inside this page's server action.
export const maxDuration = 300;

export default async function VendorImportProductsPage() {
  await requireVendor();
  return (
    <BulkUploadPanel
      sheetHref="/vendor/products/sheet"
      productsHref="/vendor/products"
      action={vendorProductSheetAction}
      vendor
    />
  );
}
