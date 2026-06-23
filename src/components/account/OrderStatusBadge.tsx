const STYLES: Record<string, string> = {
  pending: "bg-steel-100 text-steel-700",
  paid: "bg-success/15 text-success",
  processing: "bg-accent/20 text-accent-dark",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-success/20 text-success",
  cancelled: "bg-steel-200 text-steel-600",
  refunded: "bg-danger/10 text-danger",
  requested: "bg-steel-100 text-steel-700",
  approved: "bg-success/15 text-success",
  rejected: "bg-danger/10 text-danger",
  received: "bg-blue-100 text-blue-700",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        STYLES[status] ?? "bg-steel-100 text-steel-700"
      }`}
    >
      {status}
    </span>
  );
}
