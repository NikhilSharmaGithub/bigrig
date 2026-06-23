import type { Metadata } from "next";
import { ReturnRequestForm } from "@/components/account/ReturnRequestForm";
import { OrderStatusBadge } from "@/components/account/OrderStatusBadge";
import { requireUser } from "@/lib/auth";
import { getUserReturns } from "@/lib/account";

export const metadata: Metadata = { title: "Returns" };

type Props = { searchParams: Promise<{ order?: string }> };

export default async function ReturnsPage({ searchParams }: Props) {
  const user = await requireUser();
  const { order } = await searchParams;
  const list = await getUserReturns(user.id);

  return (
    <div>
      <h1 className="font-display border-b-2 border-steel-900 pb-2 text-3xl font-bold uppercase text-steel-900">
        Returns
      </h1>

      {order && (
        <div className="mt-6 max-w-xl">
          <ReturnRequestForm orderId={order} />
        </div>
      )}

      <h2 className="font-display mt-10 text-xl font-bold uppercase text-steel-900">
        Your Return Requests
      </h2>
      {list.length === 0 ? (
        <p className="mt-3 text-steel-500">No return requests yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white p-4"
            >
              <div>
                <p className="font-display font-bold text-steel-900">
                  {r.rmaNumber}
                </p>
                <p className="text-xs text-steel-500">
                  Order {r.order?.orderNumber ?? "—"} ·{" "}
                  {r.createdAt.toLocaleDateString()}
                </p>
                {r.reason && (
                  <p className="mt-1 text-sm text-steel-600">{r.reason}</p>
                )}
              </div>
              <OrderStatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
