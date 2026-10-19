"use client";

import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { productSheetAction, type SheetUploadState } from "@/app/actions/product-sheet";

export function ProductSheetUpload() {
  const [state, formAction, pending] = useActionState<SheetUploadState, FormData>(productSheetAction, {});
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState<"check" | "import" | null>(null);
  const checked = !stale ? state.checked : undefined;
  const done = !stale ? state.done : undefined;
  const error = !stale ? state.error : undefined;
  const validRows = checked ? checked.creates + checked.updates : 0;

  return (
    <form
      // Manual submit: React would otherwise clear the chosen file after each action,
      // and the Import step needs the same file again.
      onSubmit={(e) => {
        e.preventDefault();
        const submitter = (e.nativeEvent as SubmitEvent).submitter;
        const data = new FormData(e.currentTarget, submitter);
        setStale(false);
        setBusy(data.get("intent") === "import" ? "import" : "check");
        startTransition(() => formAction(data));
      }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          required
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={() => setStale(true)}
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-steel-900 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-steel-700"
        />
        <button
          type="submit"
          name="intent"
          value="check"
          disabled={pending}
          className="rounded-md border border-steel-300 bg-white px-5 py-2 text-sm font-semibold text-steel-800 hover:border-brand hover:text-brand disabled:opacity-50"
        >
          {pending && busy === "check" ? "Checking…" : "Check file"}
        </button>
      </div>
      <p className="text-xs text-steel-500">.xlsx or .csv, up to 4 MB and 5,000 rows. Nothing is saved until you press Import.</p>

      {error && <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      {done && (
        <div className="rounded-md bg-success/10 px-4 py-3 text-sm text-steel-800">
          <p className="font-semibold text-success">Import complete.</p>
          <p className="mt-1">
            {done.created.toLocaleString()} added, {done.updated.toLocaleString()} updated
            {done.skipped > 0 && <>, {done.skipped.toLocaleString()} rows skipped</>}.{" "}
            <Link href="/admin/products" className="font-semibold text-brand hover:underline">
              View products →
            </Link>
          </p>
        </div>
      )}

      {checked && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="Rows in file" value={checked.totalRows} />
            <Stat label="New products" value={checked.creates} tone="good" />
            <Stat label="Updates" value={checked.updates} tone="good" />
            <Stat label="Rows with errors" value={checked.errorRows} tone={checked.errorRows ? "bad" : undefined} />
          </div>

          {checked.unknownHeaders.length > 0 && (
            <p className="rounded-md bg-accent/15 px-3 py-2 text-sm text-steel-800">
              Ignored columns (not in the template): {checked.unknownHeaders.join(", ")}
            </p>
          )}

          {checked.errors.length > 0 && (
            <IssueTable
              title={`Fix these before importing (${checked.errors.length}${checked.errors.length >= 300 ? "+" : ""})`}
              issues={checked.errors}
              tone="bad"
            />
          )}
          {checked.warnings.length > 0 && <IssueTable title="Notes" issues={checked.warnings} />}

          {checked.preview.length > 0 && (
            <details className="rounded-md border border-border bg-white">
              <summary className="cursor-pointer px-4 py-2 text-sm font-semibold text-steel-800">
                Preview changes{validRows > checked.preview.length ? ` (first ${checked.preview.length})` : ""}
              </summary>
              <table className="w-full text-left text-xs">
                <thead className="bg-steel-50 text-steel-500">
                  <tr>
                    <th className="px-3 py-2">Row</th>
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Part</th>
                    <th className="px-3 py-2">Changes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {checked.preview.map((r) => (
                    <tr key={r.line}>
                      <td className="px-3 py-1.5 text-steel-500">{r.line}</td>
                      <td className="px-3 py-1.5">
                        <span className={r.action === "create" ? "font-semibold text-success" : "font-semibold text-steel-700"}>
                          {r.action === "create" ? "Add" : "Update"}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-steel-900">{r.label}</td>
                      <td className="px-3 py-1.5 text-steel-600">{r.changes.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}

          {validRows > 0 ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <button
                type="submit"
                name="intent"
                value="import"
                disabled={pending}
                className="rounded-md bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
              >
                {pending && busy === "import"
                  ? "Importing…"
                  : `Import ${validRows.toLocaleString()} row${validRows === 1 ? "" : "s"}`}
              </button>
              {checked.errorRows > 0 && (
                <span className="text-sm text-steel-600">
                  {checked.errorRows.toLocaleString()} row{checked.errorRows === 1 ? "" : "s"} with errors will be skipped. Or fix
                  the file and check it again.
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-steel-600">No rows can be imported yet. Fix the errors above and check the file again.</p>
          )}
        </div>
      )}
    </form>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "bad" }) {
  const color = tone === "bad" ? "text-danger" : tone === "good" ? "text-success" : "text-steel-900";
  return (
    <div className="rounded-md border border-border bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-steel-500">{label}</p>
      <p className={`font-display text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function IssueTable({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: { line: number; column?: string; message: string }[];
  tone?: "bad";
}) {
  return (
    <div className={`rounded-md border ${tone === "bad" ? "border-danger/40" : "border-border"} bg-white`}>
      <p className={`px-4 py-2 text-sm font-semibold ${tone === "bad" ? "text-danger" : "text-steel-800"}`}>{title}</p>
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-steel-50 text-steel-500">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Column</th>
              <th className="px-3 py-2">Problem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {issues.map((i, n) => (
              <tr key={n}>
                <td className="px-3 py-1.5 text-steel-500">{i.line || "—"}</td>
                <td className="px-3 py-1.5 text-steel-700">{i.column ?? ""}</td>
                <td className="px-3 py-1.5 text-steel-900">{i.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
