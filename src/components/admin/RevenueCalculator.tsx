"use client";

import { useState, useEffect } from "react";
import type { CalcProduct } from "@/lib/revenue-calc";
import { formatPrice } from "@/lib/format";

const SESSION_KEY = "bigrig_admin_rev_calc_v1";

type CalcItem = {
  productId: string;
  unitsPerMonth: number;
  costCents: number;
  customPriceCents: number;
};

type CalcSessionState = {
  items: Record<string, CalcItem>;
  taxRatePct: number;
  shippingPerOrderCents: number;
  averageUnitsPerOrder: number;
  monthlyFixedCostsCents: number;
};

const DEFAULT_STATE: CalcSessionState = {
  items: {},
  taxRatePct: 0,
  shippingPerOrderCents: 1500, // $15 default shipping per order
  averageUnitsPerOrder: 2.5,
  monthlyFixedCostsCents: 0,
};

export function RevenueCalculator({
  initialProducts,
}: {
  initialProducts: CalcProduct[];
}) {
  const [session, setSession] = useState<CalcSessionState>(DEFAULT_STATE);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSession({ ...DEFAULT_STATE, ...parsed });
      }
    } catch (e) {
      console.error("Failed to restore calculator session:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save session state to localStorage on every change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error("Failed to save calculator session:", e);
    }
  }, [session, isLoaded]);

  const addProductToCalc = (p: CalcProduct) => {
    if (session.items[p.id]) return;
    // Default estimated unit cost to 65% of selling price (35% default margin)
    const defaultCost = Math.round(p.priceCents * 0.65);
    setSession((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [p.id]: {
          productId: p.id,
          unitsPerMonth: 10,
          costCents: defaultCost,
          customPriceCents: p.priceCents,
        },
      },
    }));
  };

  const removeItem = (id: string) => {
    setSession((prev) => {
      const copy = { ...prev.items };
      delete copy[id];
      return { ...prev, items: copy };
    });
  };

  const updateItem = (id: string, updates: Partial<CalcItem>) => {
    setSession((prev) => ({
      ...prev,
      items: {
        ...prev.items,
        [id]: { ...prev.items[id], ...updates },
      },
    }));
  };

  const clearSession = () => {
    if (confirm("Reset current calculator session?")) {
      setSession(DEFAULT_STATE);
      localStorage.removeItem(SESSION_KEY);
    }
  };

  // Calculations
  const activeItems = Object.values(session.items)
    .map((item) => {
      const product = initialProducts.find((p) => p.id === item.productId);
      if (!product) return null;
      const grossRevCents = item.unitsPerMonth * item.customPriceCents;
      const totalCostCents = item.unitsPerMonth * item.costCents;
      const grossProfitCents = grossRevCents - totalCostCents;
      const marginPct =
        grossRevCents > 0
          ? ((grossProfitCents / grossRevCents) * 100).toFixed(1)
          : "0";
      return {
        ...item,
        product,
        grossRevCents,
        totalCostCents,
        grossProfitCents,
        marginPct,
      };
    })
    .filter(Boolean);

  const totalUnits = activeItems.reduce(
    (sum, i) => sum + (i?.unitsPerMonth ?? 0),
    0,
  );
  const totalGrossRevCents = activeItems.reduce(
    (sum, i) => sum + (i?.grossRevCents ?? 0),
    0,
  );
  const totalPartsCostCents = activeItems.reduce(
    (sum, i) => sum + (i?.totalCostCents ?? 0),
    0,
  );
  const estimatedOrders =
    session.averageUnitsPerOrder > 0
      ? Math.ceil(totalUnits / session.averageUnitsPerOrder)
      : 0;
  const totalShippingIncomeCents =
    estimatedOrders * session.shippingPerOrderCents;
  const totalCombinedRevenueCents =
    totalGrossRevCents + totalShippingIncomeCents;
  const netProfitCents =
    totalGrossRevCents -
    totalPartsCostCents -
    session.monthlyFixedCostsCents;
  const overallMarginPct =
    totalGrossRevCents > 0
      ? (((totalGrossRevCents - totalPartsCostCents) / totalGrossRevCents) *
          100).toFixed(1)
      : "0";

  const filteredProducts = initialProducts.filter((p) => {
    if (session.items[p.id]) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(s) ||
      p.partNumber.toLowerCase().includes(s) ||
      (p.brandName && p.brandName.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-steel-500 font-semibold">
            Monthly Parts Revenue
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-brand">
            {formatPrice(totalGrossRevCents)}
          </p>
          <p className="mt-0.5 text-xs text-steel-500">
            {totalUnits.toLocaleString()} total units / month
          </p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-steel-500 font-semibold">
            Gross Profit (Parts)
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-success">
            {formatPrice(totalGrossRevCents - totalPartsCostCents)}
          </p>
          <p className="mt-0.5 text-xs text-steel-500">
            Avg Margin: {overallMarginPct}%
          </p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-steel-500 font-semibold">
            Est. Net Profit
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-steel-900">
            {formatPrice(netProfitCents)}
          </p>
          <p className="mt-0.5 text-xs text-steel-500">
            After fixed costs ({formatPrice(session.monthlyFixedCostsCents)})
          </p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-steel-500 font-semibold">
            Est. Orders
          </p>
          <p className="font-display mt-1 text-2xl font-bold text-steel-900">
            {estimatedOrders.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xs text-steel-500">
            @{session.averageUnitsPerOrder} parts/order
          </p>
        </div>
      </div>

      {/* Product Selection & Add Bar */}
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-steel-900">
            Add Parts to Simulation
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={clearSession}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-steel-600 hover:bg-steel-50 hover:text-danger"
            >
              Reset Session
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase text-steel-700">
              Search Catalog Parts
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by part number, name or brand..."
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-steel-700">
              Select &amp; Add Part
            </label>
            <div className="mt-1 flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
              >
                <option value="">-- Choose a part ({filteredProducts.length} available) --</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.partNumber}) - {formatPrice(p.priceCents)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedProductId}
                onClick={() => {
                  const p = initialProducts.find((x) => x.id === selectedProductId);
                  if (p) {
                    addProductToCalc(p);
                    setSelectedProductId("");
                  }
                }}
                className="shrink-0 rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                + Add Part
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Calculator Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-steel-50 text-xs uppercase text-steel-500">
            <tr>
              <th className="px-4 py-3">Part Details</th>
              <th className="px-4 py-3 text-right">Selling Price</th>
              <th className="px-4 py-3 text-right">Est. Unit Cost</th>
              <th className="px-4 py-3 text-center">Monthly Volume</th>
              <th className="px-4 py-3 text-right">Monthly Rev</th>
              <th className="px-4 py-3 text-right">Gross Profit</th>
              <th className="px-4 py-3 text-center">Margin</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activeItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-steel-500">
                  No parts added to the calculator session yet. Select parts above to simulate revenue.
                </td>
              </tr>
            ) : (
              activeItems.map((item) => {
                if (!item) return null;
                return (
                  <tr key={item.productId} className="hover:bg-steel-50">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-steel-900">{item.product.name}</p>
                      <p className="text-xs text-steel-500">
                        Part #{item.product.partNumber} {item.product.brandName ? `· ${item.product.brandName}` : ""}
                      </p>
                    </td>

                    {/* Selling Price input */}
                    <td className="px-4 py-3 text-right font-medium">
                      <div className="inline-flex items-center rounded-md border border-border px-2 py-1">
                        <span className="text-steel-400 text-xs mr-1">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={(item.customPriceCents / 100).toFixed(2)}
                          onChange={(e) => {
                            const val = Math.max(0, Math.round(Number(e.target.value) * 100));
                            updateItem(item.productId, { customPriceCents: val });
                          }}
                          className="w-20 text-right text-sm focus:outline-none"
                        />
                      </div>
                    </td>

                    {/* Unit Cost input */}
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center rounded-md border border-border px-2 py-1 bg-surface">
                        <span className="text-steel-400 text-xs mr-1">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={(item.costCents / 100).toFixed(2)}
                          onChange={(e) => {
                            const val = Math.max(0, Math.round(Number(e.target.value) * 100));
                            updateItem(item.productId, { costCents: val });
                          }}
                          className="w-20 text-right text-sm focus:outline-none bg-transparent"
                        />
                      </div>
                    </td>

                    {/* Monthly Volume input */}
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.unitsPerMonth}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          updateItem(item.productId, { unitsPerMonth: val });
                        }}
                        className="w-16 rounded-md border border-border px-2 py-1 text-center text-sm font-semibold text-steel-900 focus:border-brand focus:outline-none"
                      />
                    </td>

                    {/* Total Revenue */}
                    <td className="px-4 py-3 text-right font-display font-bold text-steel-900">
                      {formatPrice(item.grossRevCents)}
                    </td>

                    {/* Gross Profit */}
                    <td className="px-4 py-3 text-right font-display font-bold text-success">
                      {formatPrice(item.grossProfitCents)}
                    </td>

                    {/* Margin % */}
                    <td className="px-4 py-3 text-center font-medium text-steel-700">
                      <span className="rounded bg-success/10 px-2 py-0.5 text-xs text-success font-bold">
                        {item.marginPct}%
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-xs text-steel-400 hover:text-danger font-medium"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Assumptions & Operational Costs Panel */}
      <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-bold uppercase tracking-wide text-steel-900 border-b border-border pb-2">
          Operational Assumptions &amp; Fixed Costs
        </h3>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-steel-700">
              Monthly Fixed Overhead / Operating Costs ($)
            </label>
            <input
              type="number"
              step="100"
              value={(session.monthlyFixedCostsCents / 100).toFixed(0)}
              onChange={(e) => {
                const val = Math.max(0, Math.round(Number(e.target.value) * 100));
                setSession((prev) => ({ ...prev, monthlyFixedCostsCents: val }));
              }}
              placeholder="e.g. 5000"
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="mt-1 text-xs text-steel-500">Software, hosting, admin wages, warehouse rent.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-steel-700">
              Avg Units Per Customer Order
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              value={session.averageUnitsPerOrder}
              onChange={(e) => {
                const val = Math.max(0.1, Number(e.target.value));
                setSession((prev) => ({ ...prev, averageUnitsPerOrder: val }));
              }}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="mt-1 text-xs text-steel-500">Used to estimate total order transactions.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-steel-700">
              Est. Shipping Charged per Order ($)
            </label>
            <input
              type="number"
              step="1"
              value={(session.shippingPerOrderCents / 100).toFixed(2)}
              onChange={(e) => {
                const val = Math.max(0, Math.round(Number(e.target.value) * 100));
                setSession((prev) => ({ ...prev, shippingPerOrderCents: val }));
              }}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-brand focus:outline-none"
            />
            <p className="mt-1 text-xs text-steel-500">Flat or average shipping income collected.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
