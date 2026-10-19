import { parseCsv } from "@/lib/csv";

/**
 * Browser-side spreadsheet reading for Bulk Upload. Parsing here (instead of
 * on the server) lets any size of file through: only the cell text is sent,
 * gzipped, which is far smaller than the file and fits the request limit.
 */

export const SPREADSHEET_EXTENSIONS = [".xlsx", ".xlsm", ".xls", ".xlsb", ".ods", ".csv", ".txt"];
/** Bigger files are slow to read in a browser tab; split them. */
export const MAX_FILE_BYTES = 60 * 1024 * 1024;
/** Request bodies are capped at ~4.5 MB by the host. */
export const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024;

function cellToText(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function cellText(cell: import("xlsx").CellObject | undefined): string {
  if (!cell || cell.t === "e" || cell.t === "z") return "";
  // Numbers shown with leading zeros (part number "00123") keep what the sheet displays.
  if (cell.t === "n" && typeof cell.w === "string" && /^0\d+$/.test(cell.w.trim())) return cell.w.trim();
  return cellToText(cell.v);
}

/** Reads the "Products" sheet (or the first sheet with data) into rows of strings. */
export async function readSpreadsheet(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (!SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    throw new Error("Upload an Excel (.xlsx or .xls), OpenDocument (.ods) or CSV file.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That file is over 60 MB. Split it into smaller files.");
  }
  if (name.endsWith(".csv") || name.endsWith(".txt")) return parseCsv(await file.text());

  const XLSX = await import("xlsx");
  let wb: import("xlsx").WorkBook;
  try {
    wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true, dense: true });
  } catch {
    throw new Error("Couldn't read that file. Open it in Excel and save it as .xlsx or .csv, then try again.");
  }
  const sheetName =
    wb.SheetNames.find((n) => n.trim().toLowerCase() === "products") ??
    wb.SheetNames.find((n) => {
      const ref = wb.Sheets[n]?.["!ref"];
      return ref && ref !== "A1";
    }) ??
    wb.SheetNames[0];
  const ws = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!ws) throw new Error("The workbook has no sheets.");
  // Dense sheets keep cells at their absolute row/column, so line numbers match Excel's.
  const data = (ws as { "!data"?: (import("xlsx").CellObject | undefined)[][] })["!data"] ?? [];
  return Array.from(data, (row) => Array.from(row ?? [], cellText));
}

/** The grid as gzipped JSON, ready to post. */
export async function packGrid(grid: string[][]): Promise<Blob> {
  const json = new Blob([JSON.stringify(grid)]).stream();
  return new Response(json.pipeThrough(new CompressionStream("gzip"))).blob();
}
