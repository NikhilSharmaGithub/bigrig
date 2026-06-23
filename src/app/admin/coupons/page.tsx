import type { Metadata } from "next";
import { CouponCreateForm } from "@/components/admin/CouponCreateForm";
import { toggleCouponAction } from "@/app/actions/admin";
import { getAdminCoupons } from "@/lib/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin · Coupons" };

export default async function AdminCouponsPage() {
  const list = await getAdminCoupons();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Coupons
      </h1>

      <div className="mt-6 rounded-lg border border-border bg-white p-5">
        <h2 className="font-display text-lg font-bold uppercase text-steel-900">
          Create a code
        </h2>
        <div className="mt-3">
          <CouponCreateForm />
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-steel-500">
                  No coupons yet.
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr key={c.id} className="hover:bg-steel-50">
                  <td className="px-4 py-3 font-display font-bold text-steel-900">
                    {c.code}
                  </td>
                  <td className="px-4 py-3 text-steel-700">
                    {c.type === "percent" ? `${c.value}%` : formatPrice(c.value)}
                  </td>
                  <td className="px-4 py-3 text-steel-600">
                    {c.minSubtotalCents > 0 ? formatPrice(c.minSubtotalCents) : "—"}
                  </td>
                  <td className="px-4 py-3 text-steel-600">
                    {c.timesRedeemed}
                    {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        c.active ? "bg-success/15 text-success" : "bg-steel-200 text-steel-600"
                      }`}
                    >
                      {c.active ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={toggleCouponAction.bind(null, c.id, !c.active)}>
                      <button
                        type="submit"
                        className="text-steel-500 hover:text-steel-900"
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
