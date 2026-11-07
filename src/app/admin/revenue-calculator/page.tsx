import type { Metadata } from "next";
import { RevenueCalculator } from "@/components/admin/RevenueCalculator";
import { getAdminProductsForCalc } from "@/lib/revenue-calc";

export const metadata: Metadata = { title: "Admin · Revenue Calculator" };

export default async function AdminRevenueCalculatorPage() {
  const products = await getAdminProductsForCalc();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Parts Revenue Calculator
      </h1>
      <p className="mt-1 text-sm text-steel-500">
        Simulate session-based sales volume, unit costs, pricing margins, and profit forecast across your catalog.
      </p>

      <div className="mt-6">
        <RevenueCalculator initialProducts={products} />
      </div>
    </div>
  );
}
