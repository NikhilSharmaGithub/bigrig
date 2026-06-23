"use client";

import { useActionState } from "react";
import { importProductsAction, type ImportState } from "@/app/actions/admin";

const SAMPLE = `name,partNumber,price,listPrice,category,brand,qty,description,image
7in LED Tail Lamp,GR-9999,21.99,28.00,led-lights,grote,40,Sealed LED tail lamp,https://example.com/lamp.jpg
Air Filter P12345,DN-P12345,44.50,,oil-filters,donaldson,120,Primary air filter,`;

export function CsvImportForm() {
  const [state, formAction, pending] = useActionState<ImportState, FormData>(
    importProductsAction,
    {},
  );

  return (
    <form action={formAction}>
      <p className="text-sm text-steel-600">
        First row must be a header. Required columns:{" "}
        <code className="rounded bg-steel-100 px-1">name</code>,{" "}
        <code className="rounded bg-steel-100 px-1">partNumber</code>,{" "}
        <code className="rounded bg-steel-100 px-1">price</code>. Optional:{" "}
        listPrice, category (slug), brand (slug), qty, description, image (URL).
      </p>
      <textarea
        name="csv"
        rows={12}
        defaultValue={SAMPLE}
        spellCheck={false}
        className="mt-3 w-full rounded-md border border-border bg-white p-3 font-mono text-xs text-steel-900 focus:outline-none focus:ring-2 focus:ring-brand"
      />
      {state.error && <p className="mt-2 text-sm text-danger">{state.error}</p>}
      {state.summary && (
        <p className="mt-2 rounded-md bg-success/10 px-3 py-2 text-sm text-steel-800">
          {state.summary}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 rounded-md bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:bg-steel-400"
      >
        {pending ? "Importing…" : "Import Products"}
      </button>
    </form>
  );
}
