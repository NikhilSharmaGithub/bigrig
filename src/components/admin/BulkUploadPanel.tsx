import Link from "next/link";
import { ProductSheetUpload } from "@/components/admin/ProductSheetUpload";
import type { SheetUploadState } from "@/app/actions/product-sheet";

/** The Bulk Upload screen, shared by Admin → Products and the vendor portal. */
export function BulkUploadPanel({
  sheetHref: SHEET,
  productsHref,
  action,
  vendor = false,
}: {
  sheetHref: string;
  productsHref: string;
  action: (prev: SheetUploadState, formData: FormData) => Promise<SheetUploadState>;
  vendor?: boolean;
}) {
  const btn =
    "rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand";
  return (
    <div className="max-w-4xl">
      <Link href={productsHref} className="text-sm font-medium text-brand hover:underline">
        ← Back to products
      </Link>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-wide text-steel-900">
        Bulk Upload
      </h1>
      <p className="mt-1 text-sm text-steel-600">
        Add new parts or update existing ones from an Excel (.xlsx or .xls), OpenDocument (.ods) or CSV file.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold text-steel-900">1. Get the template</h2>
        <p className="mt-1 text-sm text-steel-600">
          The Excel template has Category and Brand dropdowns, lists of every category and brand, and a &ldquo;How to
          use&rdquo; sheet.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`${SHEET}?kind=template&format=xlsx`} className={btn}>
            ⬇ Excel template (.xlsx)
          </a>
          <a href={`${SHEET}?kind=template&format=csv`} className={btn}>
            ⬇ CSV template (.csv)
          </a>
        </div>
        <p className="mt-4 text-sm text-steel-600">
          To change many products you already have, export them, edit the cells, and upload the same file
          {vendor ? "" : " (marketplace vendors' listings aren't included; vendors manage their own)"}:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={`${SHEET}?kind=export&format=xlsx`} className={btn}>
            ⬇ Export {vendor ? "my" : "store"} products (.xlsx)
          </a>
          <a href={`${SHEET}?kind=export&format=csv`} className={btn}>
            ⬇ Export {vendor ? "my" : "store"} products (.csv)
          </a>
        </div>
      </section>

      <section className="mt-4 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold text-steel-900">2. Fill it in</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-steel-700">
          <li>
            <b>Part Number</b> is always needed. If it already exists, that product is <b>updated</b>. If it&apos;s new,
            a product is <b>added</b> (then <b>Name</b> and <b>Price</b> are required too).
          </li>
          <li>When updating, leave a cell blank to keep the current value. Only filled-in cells change.</li>
          <li>
            To empty a field (List Price, Category, Brand, Description, Highlights, Keywords, Image URLs), type{" "}
            <code className="rounded bg-steel-100 px-1">[clear]</code> in that cell. Or tick &ldquo;Empty cells clear the
            field&rdquo; below when uploading an edited export.
          </li>
          <li>Up to 50,000 rows per file. Bigger catalogs can be uploaded in several files.</li>
          {vendor && (
            <li>
              Use a brand that&apos;s already in the store (see the Brands sheet in the Excel template). Need a new brand?
              Contact us and we&apos;ll add it.
            </li>
          )}
          <li>
            Optional: List Price, Quantity, Category, Brand, Status (Active/Hidden), Description, Highlights, Keywords,
            Image URLs. Hover a header in the Excel template for help.
          </li>
          <li>Keep the ID column from an export. It updates that exact product even if you change its part number.</li>
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold text-steel-900">3. Upload, check, import</h2>
        <div className="mt-3">
          <ProductSheetUpload action={action} productsHref={productsHref} />
        </div>
      </section>
    </div>
  );
}
