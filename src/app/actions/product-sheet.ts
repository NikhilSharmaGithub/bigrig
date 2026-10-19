"use server";

import { gunzipSync } from "node:zlib";
import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { NAV_CATEGORIES_TAG } from "@/lib/queries";
import {
  applyProductSheet,
  planProductSheet,
  readProductGrid,
  type SheetIssue,
} from "@/lib/product-sheet";

export type SheetPreviewRow = { line: number; action: "create" | "update"; label: string; changes: string[] };

export type SheetUploadState = {
  error?: string;
  fileName?: string;
  checked?: {
    totalRows: number;
    creates: number;
    updates: number;
    errorRows: number;
    errors: SheetIssue[];
    warnings: SheetIssue[];
    unknownHeaders: string[];
    preview: SheetPreviewRow[];
  };
  done?: { created: number; updated: number; skipped: number };
};

const MAX_LISTED = 300;
const MAX_GRID_BYTES = 150 * 1024 * 1024; // unzipped; caps a zip bomb
const MAX_CELL = 20_000;

/** The browser posts the sheet's cells as gzipped JSON (see lib/sheet-file.ts). */
async function unpackGrid(blob: unknown): Promise<string[][] | { error: string }> {
  if (!(blob instanceof Blob) || blob.size === 0) return { error: "Choose a file to upload." };
  let parsed: unknown;
  try {
    const json = gunzipSync(Buffer.from(await blob.arrayBuffer()), { maxOutputLength: MAX_GRID_BYTES });
    parsed = JSON.parse(json.toString("utf8"));
  } catch {
    return { error: "Couldn't read the uploaded data. Reload the page and try again." };
  }
  if (!Array.isArray(parsed)) return { error: "Couldn't read the uploaded data." };
  return parsed.map((row) =>
    Array.isArray(row) ? row.map((c) => (c === null || c === undefined ? "" : String(c).slice(0, MAX_CELL))) : [],
  );
}

/**
 * intent=check validates the sheet and reports what would happen; intent=import
 * re-validates the same sheet, then writes only the valid rows.
 */
export async function productSheetAction(
  _prev: SheetUploadState,
  formData: FormData,
): Promise<SheetUploadState> {
  await requireAdmin();
  const fileName = String(formData.get("fileName") ?? "upload").slice(0, 200);
  const grid = await unpackGrid(formData.get("grid"));
  if ("error" in grid) return { error: grid.error, fileName };

  const parsed = readProductGrid(grid);
  if ("error" in parsed) return { error: parsed.error, fileName };
  const plan = await planProductSheet(parsed.rows, { blankClears: formData.get("blankClears") === "on" });

  if (formData.get("intent") === "import") {
    if (plan.rows.length === 0) return { error: "No valid rows to import.", fileName };
    try {
      const { created, updated } = await applyProductSheet(plan);
      revalidatePath("/admin/products");
      revalidatePath("/", "layout");
      updateTag(NAV_CATEGORIES_TAG);
      return {
        fileName,
        done: { created, updated, skipped: plan.totalRows - plan.rows.length },
      };
    } catch (err) {
      console.error("[product-sheet] import failed", err);
      return {
        error: "The import failed and nothing was saved. Check the file and try again.",
        fileName,
      };
    }
  }

  const creates = plan.rows.filter((r) => r.action === "create").length;
  return {
    fileName,
    checked: {
      totalRows: plan.totalRows,
      creates,
      updates: plan.rows.length - creates,
      errorRows: new Set(plan.errors.map((e) => e.line)).size,
      errors: plan.errors.slice(0, MAX_LISTED),
      warnings: plan.warnings.slice(0, MAX_LISTED),
      unknownHeaders: parsed.unknownHeaders,
      preview: plan.rows.slice(0, 100).map((r) => ({
        line: r.line,
        action: r.action,
        label: r.label,
        changes: r.changes,
      })),
    },
  };
}
