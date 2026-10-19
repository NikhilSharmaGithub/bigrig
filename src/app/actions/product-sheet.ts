"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { NAV_CATEGORIES_TAG } from "@/lib/queries";
import {
  applyProductSheet,
  planProductSheet,
  readProductSheet,
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

/**
 * intent=check validates the file and reports what would happen; intent=import
 * re-reads and re-validates the same file, then writes only the valid rows.
 */
export async function productSheetAction(
  _prev: SheetUploadState,
  formData: FormData,
): Promise<SheetUploadState> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose a file to upload." };

  const parsed = await readProductSheet(file);
  if ("error" in parsed) return { error: parsed.error, fileName: file.name };
  const plan = await planProductSheet(parsed.rows);

  if (formData.get("intent") === "import") {
    if (plan.rows.length === 0) return { error: "No valid rows to import.", fileName: file.name };
    try {
      const { created, updated } = await applyProductSheet(plan);
      revalidatePath("/admin/products");
      revalidatePath("/", "layout");
      updateTag(NAV_CATEGORIES_TAG);
      return {
        fileName: file.name,
        done: { created, updated, skipped: plan.totalRows - plan.rows.length },
      };
    } catch (err) {
      console.error("[product-sheet] import failed", err);
      return {
        error: "The import failed and nothing was saved. Check the file and try again.",
        fileName: file.name,
      };
    }
  }

  const creates = plan.rows.filter((r) => r.action === "create").length;
  return {
    fileName: file.name,
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
