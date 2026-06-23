import Link from "next/link";
import type { Metadata } from "next";
import { StatusForm } from "@/components/admin/StatusForm";
import { getAdminVendors } from "@/lib/admin";
import { updateVendorStatusAction } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Admin · Vendors" };

const VENDOR_STATUSES = ["pending", "approved", "suspended"] as const;

export default async function AdminVendorsPage() {
  const vendors = await getAdminVendors();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
        Vendors ({vendors.length})
      </h1>

      {vendors.length === 0 ? (
        <p className="mt-6 text-steel-500">No sellers have signed up yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-border bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-steel-50 text-left text-xs uppercase tracking-wide text-steel-500">
              <tr>
                <th className="px-4 py-3">Store</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-steel-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/store/${v.slug}`}
                      className="font-display font-bold text-brand hover:underline"
                    >
                      {v.storeName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-steel-600">{v.email ?? "—"}</td>
                  <td className="px-4 py-3 text-steel-600">{v.productCount}</td>
                  <td className="px-4 py-3 text-steel-600">
                    {v.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <StatusForm
                      action={updateVendorStatusAction}
                      id={v.id}
                      current={v.status}
                      options={VENDOR_STATUSES}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
