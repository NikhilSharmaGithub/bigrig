"use client";

export function DeleteProductButton({
  name,
  action,
}: {
  name: string;
  action: () => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Delete "${name}" permanently?\n\n` +
            "Its photos, stock, reviews, questions and wishlist/cart entries are removed too. " +
            "Past orders keep their line items.\n\n" +
            "If you might sell it again, use Hide instead.",
        );
        if (!ok) e.preventDefault();
      }}
    >
      <button type="submit" className="text-red-600 hover:text-red-800">
        Delete
      </button>
    </form>
  );
}
