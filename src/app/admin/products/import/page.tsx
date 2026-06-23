import Link from "next/link";
import type { Metadata } from "next";
import { CsvImportForm } from "@/components/admin/CsvImportForm";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin · Import Products" };

export default async function ImportProductsPage() {
  await requireAdmin();
  return (
    <div>
      <Link href="/admin/products" className="text-sm font-medium text-brand hover:underline">
        ← Back to products
      </Link>
      <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-wide text-steel-900">
        Bulk Import
      </h1>
      <div className="mt-6 max-w-3xl rounded-lg border border-border bg-white p-5">
        <CsvImportForm />
      </div>
    </div>
  );
}
