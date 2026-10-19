import Link from "next/link";
import type { Metadata } from "next";
import { ProductSheetUpload } from "@/components/admin/ProductSheetUpload";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin · Bulk Upload" };
// Large imports run inside this page's server action.
export const maxDuration = 300;

const SHEET = "/admin/products/sheet";

export default async function ImportProductsPage() {
  await requireAdmin();
  const btn =
    "rounded-md border border-border bg-white px-4 py-2 text-sm font-semibold text-steel-700 hover:border-brand hover:text-brand";
  return (
    <div className="max-w-4xl">
      <Link href="/admin/products" className="text-sm font-medium text-brand hover:underline">
        ← Back to products
      </Link>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-wide text-steel-900">
        Bulk Upload
      </h1>
      <p className="mt-1 text-sm text-steel-600">
        Add new parts or update existing ones from an Excel or CSV file.
      </p>

      <section className="mt-6 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold text-steel-900">1. Get the template</h2>
        <p className="mt-1 text-sm text-steel-600">
          The Excel template has a Category dropdown, a list of every category, and a &ldquo;How to use&rdquo; sheet.
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
          To change many products you already have, export them, edit the cells, and upload the same file:
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={`${SHEET}?kind=export&format=xlsx`} className={btn}>
            ⬇ Export all products (.xlsx)
          </a>
          <a href={`${SHEET}?kind=export&format=csv`} className={btn}>
            ⬇ Export all products (.csv)
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
            Optional: List Price, Quantity, Category, Brand, Status (Active/Hidden), Description, Highlights, Keywords,
            Image URLs. Hover a header in the Excel template for help.
          </li>
          <li>Keep the ID column from an export. It updates that exact product even if you change its part number.</li>
        </ul>
      </section>

      <section className="mt-4 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold text-steel-900">3. Upload, check, import</h2>
        <div className="mt-3">
          <ProductSheetUpload />
        </div>
      </section>
    </div>
  );
}
