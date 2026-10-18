"use client";

/** A form whose submit asks for confirmation first (for irreversible actions). */
export function ConfirmSubmit({
  action,
  message,
  label,
  className,
}: {
  action: () => Promise<void>;
  message: string;
  label: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
