import "server-only";
import { randomUUID } from "node:crypto";
import ExcelJS from "exceljs";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { brands, categories, inventory, productImages, products } from "@/db/schema";
import { slugify } from "@/lib/vendor";

/**
 * Bulk add / update of products from a spreadsheet (.xlsx or .csv).
 *
 * Rows match an existing product by ID (present in exports) or else by part
 * number; anything unmatched is created. On updates a blank cell means "leave
 * as is", so a sheet only needs the columns being changed.
 */

export const MAX_SHEET_ROWS = 5000;
export const MAX_SHEET_BYTES = 4 * 1024 * 1024;
const MAX_IMAGES = 8;

type Key =
  | "id"
  | "partNumber"
  | "name"
  | "price"
  | "listPrice"
  | "qty"
  | "category"
  | "brand"
  | "status"
  | "description"
  | "highlights"
  | "keywords"
  | "images";

type Column = { key: Key; header: string; aliases: string[]; help: string; width: number };

/** Template column order. Headers are matched case/space-insensitively, aliases too. */
export const SHEET_COLUMNS: Column[] = [
  { key: "partNumber", header: "Part Number", aliases: ["partno", "part", "partnum", "sku", "mpn"], help: "Required. Used to find the product to update; new part numbers are added as new products.", width: 18 },
  { key: "name", header: "Name", aliases: ["title", "productname", "partname", "description1"], help: "Required for new products. The product title shoppers see.", width: 40 },
  { key: "price", header: "Price", aliases: ["saleprice", "ourprice", "unitprice"], help: "Required for new products. Selling price in US dollars, e.g. 49.99.", width: 10 },
  { key: "listPrice", header: "List Price", aliases: ["msrp", "compareatprice", "retailprice", "wasprice"], help: "Optional. Higher 'was' price shown struck through.", width: 10 },
  { key: "qty", header: "Quantity", aliases: ["qty", "stock", "onhand", "inventory", "quantityonhand"], help: "Units in stock (whole number). 0 = backorder.", width: 10 },
  { key: "category", header: "Category", aliases: ["subcategory", "categorypath"], help: "Subcategory exactly as on the Categories sheet, e.g. 'Brakes, Suspension & Steering > Air Brake Valves'. The subcategory name alone also works when it is unique.", width: 42 },
  { key: "brand", header: "Brand", aliases: ["manufacturer", "make", "mfr"], help: "Brand name. A brand that doesn't exist yet is created.", width: 18 },
  { key: "status", header: "Status", aliases: ["active", "visible", "visibility"], help: "Active (shown in the store) or Hidden. New products default to Active.", width: 10 },
  { key: "description", header: "Description", aliases: ["longdescription", "details", "body"], help: "Product description.", width: 50 },
  { key: "highlights", header: "Highlights", aliases: ["bullets", "features", "bulletpoints"], help: "Bullet points: one per line inside the cell, or separated by |", width: 40 },
  { key: "keywords", header: "Keywords", aliases: ["tags", "searchterms", "crossreference", "interchange"], help: "Comma-separated search words, e.g. cross-reference part numbers.", width: 30 },
  { key: "images", header: "Image URLs", aliases: ["images", "image", "imageurl", "photos", "photo", "picture"], help: `Up to ${MAX_IMAGES} image links (https://…), separated by spaces, commas or |. Replaces the product's current images.`, width: 50 },
  { key: "id", header: "ID", aliases: ["productid", "uuid"], help: "Leave blank for new products. Filled in when you export — keep it to update that exact product.", width: 38 },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

const HEADER_LOOKUP = new Map<string, Key>();
for (const c of SHEET_COLUMNS) {
  HEADER_LOOKUP.set(norm(c.header), c.key);
  for (const a of c.aliases) HEADER_LOOKUP.set(norm(a), c.key);
}

/* ----------------------------------------------------------------------------
 * Reading files
 * ------------------------------------------------------------------------- */

type RawRow = { line: number; cells: Partial<Record<Key, string>> };
export type ParsedSheet = { rows: RawRow[]; unknownHeaders: string[] } | { error: string };

function parseCsv(text: string): string[][] {
  const firstLine = text.split("\n", 1)[0];
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length] as const);
  const delim = counts.sort((a, b) => b[1] - a[1])[0][0];

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === delim) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("hyperlink" in v) return String(v.hyperlink || v.text || "");
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("text" in v) return String(v.text);
    if ("error" in v) return "";
  }
  return String(v);
}

async function readXlsx(buf: ArrayBuffer): Promise<string[][] | { error: string }> {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(buf);
  } catch {
    return { error: "Couldn't read that Excel file. Save it as .xlsx (Excel Workbook) or .csv and try again." };
  }
  const ws = wb.getWorksheet("Products") ?? wb.worksheets.find((w) => w.rowCount > 0);
  if (!ws) return { error: "The workbook has no sheet with data." };
  const rows: string[][] = [];
  const width = ws.columnCount;
  ws.eachRow({ includeEmpty: true }, (row, n) => {
    const out: string[] = [];
    for (let c = 1; c <= width; c++) out.push(cellText(row.getCell(c).value));
    rows[n - 1] = out;
  });
  return Array.from(rows, (r) => r ?? []);
}

export async function readProductSheet(file: File): Promise<ParsedSheet> {
  if (!file || file.size === 0) return { error: "Choose a file to upload." };
  if (file.size > MAX_SHEET_BYTES) return { error: "That file is over 4 MB. Split it into smaller files." };
  const name = file.name.toLowerCase();
  let grid: string[][];
  if (name.endsWith(".xlsx")) {
    const r = await readXlsx(await file.arrayBuffer());
    if ("error" in r) return r;
    grid = r;
  } else if (name.endsWith(".csv") || name.endsWith(".txt")) {
    grid = parseCsv((await file.text()).replace(/^﻿/, ""));
  } else if (name.endsWith(".xls")) {
    return { error: "Old .xls files aren't supported. In Excel use File → Save As → Excel Workbook (.xlsx), or CSV." };
  } else {
    return { error: "Upload an .xlsx or .csv file." };
  }

  const headerIdx = grid.findIndex((r) => r.some((c) => c.trim() !== ""));
  if (headerIdx < 0) return { error: "The file is empty." };
  const header = grid[headerIdx];
  const keys: (Key | null)[] = header.map((h) => HEADER_LOOKUP.get(norm(h)) ?? null);
  const unknownHeaders = header.filter((h, i) => h.trim() && !keys[i]).map((h) => h.trim());
  if (!keys.includes("partNumber") && !keys.includes("id")) {
    return {
      error: `Couldn't find a "Part Number" column in the first row. Start from the template so the headers match.${
        unknownHeaders.length ? ` Found: ${unknownHeaders.slice(0, 8).join(", ")}` : ""
      }`,
    };
  }
  const seen = new Set<Key>();
  for (const k of keys) {
    if (!k) continue;
    if (seen.has(k)) {
      const col = SHEET_COLUMNS.find((c) => c.key === k)!;
      return { error: `The "${col.header}" column appears twice. Keep only one.` };
    }
    seen.add(k);
  }

  const rows: RawRow[] = [];
  for (let i = headerIdx + 1; i < grid.length; i++) {
    const r = grid[i] ?? [];
    if (!r.some((c) => (c ?? "").trim() !== "")) continue;
    const cells: Partial<Record<Key, string>> = {};
    keys.forEach((k, ci) => {
      if (k) cells[k] = (r[ci] ?? "").trim();
    });
    rows.push({ line: i + 1, cells });
  }
  if (rows.length === 0) return { error: "No product rows under the header row." };
  if (rows.length > MAX_SHEET_ROWS) {
    return { error: `That's ${rows.length.toLocaleString()} rows; the limit is ${MAX_SHEET_ROWS.toLocaleString()} per file. Split it up.` };
  }
  return { rows, unknownHeaders };
}

/* ----------------------------------------------------------------------------
 * Validation → plan
 * ------------------------------------------------------------------------- */

export type SheetIssue = { line: number; column?: string; message: string };

type ProductFields = {
  partNumber?: string;
  name?: string;
  priceCents?: number;
  listPriceCents?: number | null;
  categoryId?: string;
  brandKey?: string; // normalized brand name, resolved to an id at apply time
  isActive?: boolean;
  description?: string;
  highlights?: string;
  keywords?: string;
};

type PlannedRow = {
  line: number;
  action: "create" | "update";
  productId: string; // existing id, or a fresh one for creates
  fields: ProductFields;
  qty?: number;
  images?: string[];
  label: string;
  changes: string[];
};

export type SheetPlan = {
  rows: PlannedRow[];
  errors: SheetIssue[];
  warnings: SheetIssue[];
  newBrands: string[];
  totalRows: number;
};

const header = (k: Key) => SHEET_COLUMNS.find((c) => c.key === k)!.header;

function money(raw: string): number | null {
  const s = raw.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Math.round(Number(s) * 100);
}

function parseStatus(raw: string): boolean | null {
  const s = norm(raw);
  if (["active", "yes", "y", "true", "1", "visible", "show", "shown", "live", "on"].includes(s)) return true;
  if (["hidden", "no", "n", "false", "0", "hide", "inactive", "off", "draft"].includes(s)) return false;
  return null;
}

function parseImages(raw: string): { urls: string[]; bad: string[] } {
  // Full links, or this site's own paths ("/products/x.svg") as found in exports.
  const ok = (u: string) => /^https?:\/\/\S+$/i.test(u) || /^\/(?!\/)\S+$/.test(u);
  const parts = raw.split(/[\s,|]+/).filter(Boolean);
  return { urls: parts.filter(ok).slice(0, MAX_IMAGES), bad: parts.filter((u) => !ok(u)) };
}

function highlightsText(raw: string): string {
  const lines = raw.includes("\n") ? raw.split(/\r?\n/) : raw.split("|");
  return lines.map((l) => l.replace(/^[\s•\-*]+/, "").trim()).filter(Boolean).join("\n");
}

const partKey = (s: string) => s.trim().toUpperCase();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Category lookup: "Parent > Child", subcategory slug, or a unique subcategory name. */
async function categoryResolver() {
  const all = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name, parentId: categories.parentId })
    .from(categories);
  const byId = new Map(all.map((c) => [c.id, c]));
  const exact = new Map<string, string>();
  const byName = new Map<string, string[]>();
  for (const c of all) {
    exact.set(norm(c.slug), c.id);
    const parent = c.parentId ? byId.get(c.parentId) : null;
    if (parent) exact.set(norm(`${parent.name}>${c.name}`), c.id);
    const list = byName.get(norm(c.name)) ?? [];
    list.push(c.id);
    byName.set(norm(c.name), list);
  }
  return (raw: string): { id?: string; error?: string } => {
    const key = norm(raw.replace(/›|»|\//g, ">"));
    const hit = exact.get(key);
    if (hit) return { id: hit };
    const named = byName.get(key) ?? byName.get(norm(raw.split(/>|›|»|\//).pop() ?? ""));
    if (named?.length === 1) return { id: named[0] };
    if (named && named.length > 1) {
      return { error: `"${raw}" matches more than one category; write it as "Parent > ${raw}"` };
    }
    return { error: `Unknown category "${raw}". Use a name from the Categories sheet of the template.` };
  };
}

export async function planProductSheet(rows: RawRow[]): Promise<SheetPlan> {
  const errors: SheetIssue[] = [];
  const warnings: SheetIssue[] = [];

  const [existing, brandRows, resolveCategory] = await Promise.all([
    db.select({ id: products.id, partNumber: products.partNumber, name: products.name }).from(products),
    db.select({ id: brands.id, slug: brands.slug, name: brands.name }).from(brands),
    categoryResolver(),
  ]);
  const byId = new Map(existing.map((p) => [p.id, p]));
  const byPart = new Map<string, string[]>();
  for (const p of existing) {
    const k = partKey(p.partNumber);
    byPart.set(k, [...(byPart.get(k) ?? []), p.id]);
  }
  const knownBrands = new Set<string>();
  for (const b of brandRows) {
    knownBrands.add(norm(b.name));
    knownBrands.add(norm(b.slug));
  }
  const newBrands = new Map<string, string>();

  const claimed = new Map<string, number>(); // product id or new part number → first line
  const planned: PlannedRow[] = [];

  for (const { line, cells } of rows) {
    if (partKey(cells.partNumber ?? "").startsWith("EXAMPLE-")) {
      warnings.push({ line, message: "Template example row skipped. Delete it from your sheet." });
      continue;
    }
    const rowErrors: SheetIssue[] = [];
    const err = (k: Key | undefined, message: string) =>
      rowErrors.push({ line, column: k ? header(k) : undefined, message });
    const get = (k: Key) => cells[k] ?? "";

    // --- which product is this row?
    let action: "create" | "update" = "create";
    let productId = "";
    const id = get("id");
    const part = get("partNumber");
    if (id) {
      if (!UUID_RE.test(id) || !byId.has(id.toLowerCase())) {
        err("id", `No product with ID "${id}". Clear the ID cell to add it as a new product.`);
      } else {
        action = "update";
        productId = id.toLowerCase();
      }
    } else if (!part) {
      err("partNumber", "Part number is missing.");
    } else {
      const matches = byPart.get(partKey(part)) ?? [];
      if (matches.length > 1) {
        err(
          "partNumber",
          `${matches.length} products already use part number "${part}". Export the products and keep the ID column to say which one to update.`,
        );
      } else if (matches.length === 1) {
        action = "update";
        productId = matches[0];
      }
    }
    const claimKey = productId || `new:${partKey(part)}`;
    if (!rowErrors.length) {
      const first = claimed.get(claimKey);
      if (first) err(id ? "id" : "partNumber", `Same product as row ${first}. Each product can appear only once per file.`);
      else claimed.set(claimKey, line);
    }

    // --- field values (blank = unchanged on updates)
    const fields: ProductFields = {};
    const changes: string[] = [];
    if (part) {
      if (part.length > 80) err("partNumber", "Part number is longer than 80 characters.");
      else if (action === "create" || (id && partKey(part) !== partKey(byId.get(productId)?.partNumber ?? ""))) {
        fields.partNumber = part;
        if (action === "update") changes.push("part number");
      }
    }
    const name = get("name");
    if (name) {
      if (name.length > 200) err("name", "Name is longer than 200 characters.");
      else {
        fields.name = name;
        changes.push("name");
      }
    } else if (action === "create") err("name", "Name is required for a new product.");

    const price = get("price");
    if (price) {
      const cents = money(price);
      if (cents === null || cents <= 0) err("price", `Price "${price}" isn't a valid dollar amount.`);
      else {
        fields.priceCents = cents;
        changes.push("price");
      }
    } else if (action === "create") err("price", "Price is required for a new product.");

    const list = get("listPrice");
    if (list) {
      const cents = money(list);
      if (cents === null) err("listPrice", `List price "${list}" isn't a valid dollar amount.`);
      else {
        fields.listPriceCents = cents > 0 ? cents : null;
        changes.push("list price");
        if (cents > 0 && fields.priceCents && cents < fields.priceCents) {
          warnings.push({ line, column: header("listPrice"), message: "List price is lower than the price, so no discount will show." });
        }
      }
    }

    let qty: number | undefined;
    const qtyRaw = get("qty");
    if (qtyRaw) {
      const n = Number(qtyRaw.replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) err("qty", `Quantity "${qtyRaw}" must be a whole number, 0 or more.`);
      else {
        qty = n;
        changes.push("quantity");
      }
    }

    const cat = get("category");
    if (cat) {
      const r = resolveCategory(cat);
      if (r.error) err("category", r.error);
      else {
        fields.categoryId = r.id;
        changes.push("category");
      }
    }

    const brand = get("brand");
    if (brand) {
      const k = norm(brand);
      if (!k) err("brand", "Brand name has no letters or numbers.");
      else {
        fields.brandKey = k;
        changes.push("brand");
        if (!knownBrands.has(k) && !newBrands.has(k)) newBrands.set(k, brand);
      }
    }

    const status = get("status");
    if (status) {
      const s = parseStatus(status);
      if (s === null) err("status", `Status "${status}" should be Active or Hidden.`);
      else {
        fields.isActive = s;
        changes.push(s ? "shown" : "hidden");
      }
    }

    for (const k of ["description", "keywords"] as const) {
      const v = get(k);
      if (v) {
        fields[k] = v;
        changes.push(k);
      }
    }
    const hl = get("highlights");
    if (hl) {
      fields.highlights = highlightsText(hl);
      changes.push("highlights");
    }

    let images: string[] | undefined;
    const img = get("images");
    if (img) {
      const { urls, bad } = parseImages(img);
      if (bad.length) err("images", `Not an image link: "${bad[0].slice(0, 60)}". Links must start with https://`);
      else {
        images = urls;
        changes.push(`${urls.length} image${urls.length === 1 ? "" : "s"}`);
      }
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
      continue;
    }
    if (action === "update" && changes.length === 0) {
      warnings.push({ line, message: "Nothing to change on this row (all cells blank), skipped." });
      continue;
    }
    planned.push({
      line,
      action,
      productId: productId || randomUUID(),
      fields,
      qty,
      images,
      label: `${fields.partNumber ?? byId.get(productId)?.partNumber ?? part} · ${fields.name ?? byId.get(productId)?.name ?? ""}`,
      changes,
    });
  }

  for (const [, original] of newBrands) {
    warnings.push({ line: 0, column: "Brand", message: `New brand "${original}" will be created.` });
  }

  return { rows: planned, errors, warnings, newBrands: [...newBrands.values()], totalRows: rows.length };
}

/* ----------------------------------------------------------------------------
 * Applying
 * ------------------------------------------------------------------------- */

function chunks<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Writes a plan in one transaction: either every valid row lands or none do. */
export async function applyProductSheet(plan: SheetPlan): Promise<{ created: number; updated: number }> {
  const creates = plan.rows.filter((r) => r.action === "create");
  const updates = plan.rows.filter((r) => r.action === "update");

  await db.transaction(async (tx) => {
    // Brands first, so every row's brand resolves to an id.
    if (plan.newBrands.length) {
      const existingSlugs = new Set((await tx.select({ slug: brands.slug }).from(brands)).map((b) => b.slug));
      const values = plan.newBrands.map((name) => {
        let slug = slugify(name);
        while (existingSlugs.has(slug)) slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 5)}`;
        existingSlugs.add(slug);
        return { name, slug };
      });
      await tx.insert(brands).values(values).onConflictDoNothing();
    }
    const brandId = new Map<string, string>();
    for (const b of await tx.select({ id: brands.id, slug: brands.slug, name: brands.name }).from(brands)) {
      brandId.set(norm(b.slug), b.id);
      brandId.set(norm(b.name), b.id);
    }
    const brandOf = (f: ProductFields) => (f.brandKey ? (brandId.get(f.brandKey) ?? null) : undefined);

    // New products, with unique slugs.
    if (creates.length) {
      const slugs = new Set((await tx.select({ slug: products.slug }).from(products)).map((p) => p.slug));
      const rows = creates.map((r) => {
        const base = slugify(`${r.fields.name} ${r.fields.partNumber}`);
        let slug = base;
        while (slugs.has(slug)) slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        slugs.add(slug);
        return {
          id: r.productId,
          slug,
          name: r.fields.name!,
          partNumber: r.fields.partNumber!,
          priceCents: r.fields.priceCents!,
          listPriceCents: r.fields.listPriceCents ?? null,
          categoryId: r.fields.categoryId ?? null,
          brandId: brandOf(r.fields) ?? null,
          isActive: r.fields.isActive ?? true,
          description: r.fields.description ?? null,
          highlights: r.fields.highlights ?? null,
          keywords: r.fields.keywords ?? null,
        };
      });
      for (const part of chunks(rows, 500)) await tx.insert(products).values(part);
    }

    // Updates: only the columns the sheet filled in. Issued together so postgres-js pipelines them.
    const now = new Date();
    for (const part of chunks(updates, 200)) {
      await Promise.all(
        part.map((r) => {
          const { brandKey, ...rest } = r.fields;
          void brandKey;
          const set: Partial<typeof products.$inferInsert> = { ...rest, updatedAt: now };
          const b = brandOf(r.fields);
          if (b !== undefined) set.brandId = b;
          return tx.update(products).set(set).where(eq(products.id, r.productId));
        }),
      );
    }

    // Stock: new products always get a row; updates only when Quantity was filled in.
    const stock = plan.rows
      .filter((r) => r.action === "create" || r.qty !== undefined)
      .map((r) => ({ productId: r.productId, quantity: r.qty ?? 0, updatedAt: now }));
    for (const part of chunks(stock, 500)) {
      await tx
        .insert(inventory)
        .values(part)
        .onConflictDoUpdate({
          target: inventory.productId,
          set: { quantity: sql`excluded.quantity`, updatedAt: now },
        });
    }

    // Images replace the product's current set when the cell is filled in.
    const withImages = plan.rows.filter((r) => r.images !== undefined);
    for (const part of chunks(withImages, 500)) {
      await tx.delete(productImages).where(inArray(productImages.productId, part.map((r) => r.productId)));
      const values = part.flatMap((r) => r.images!.map((url, position) => ({ productId: r.productId, url, position })));
      if (values.length) await tx.insert(productImages).values(values);
    }
  });

  return { created: creates.length, updated: updates.length };
}

/* ----------------------------------------------------------------------------
 * Writing: template + export
 * ------------------------------------------------------------------------- */

export type SheetFormat = "csv" | "xlsx";
type SheetRow = Partial<Record<Key, string | number>>;

const EXAMPLES: SheetRow[] = [
  {
    partNumber: "EXAMPLE-53252",
    name: "Grote 4in Round LED Stop/Tail/Turn Lamp",
    price: 24.99,
    listPrice: 32,
    qty: 40,
    brand: "Grote",
    status: "Active",
    description: "Sealed 4in round LED stop/tail/turn lamp with grommet mount.",
    highlights: "Sealed against water and road salt\nGrommet mount, PL-3 plug",
    keywords: "53252, stop tail turn, led lamp",
    images: "https://example.com/images/gr-53252.jpg",
  },
  {
    partNumber: "EXAMPLE-28457",
    name: "Bendix-Style Relay Valve",
    price: 64.5,
    qty: 12,
    brand: "Haldex",
    status: "Hidden",
    description: "Air brake relay valve, 4-port.",
  },
];

async function categoryChoices(): Promise<string[]> {
  const all = await db
    .select({ id: categories.id, name: categories.name, parentId: categories.parentId })
    .from(categories)
    .orderBy(categories.position, categories.name);
  const byId = new Map(all.map((c) => [c.id, c]));
  return all
    .filter((c) => c.parentId)
    .map((c) => `${byId.get(c.parentId!)?.name ?? ""} > ${c.name}`)
    .sort((a, b) => a.localeCompare(b));
}

async function exportRows(): Promise<SheetRow[]> {
  // Columns spelled out: drizzle leaves them unqualified inside a correlated subquery.
  const parent = sql<string | null>`(SELECT p."name" FROM "categories" p WHERE p."id" = "categories"."parent_id")`;
  const rows = await db
    .select({
      id: products.id,
      partNumber: products.partNumber,
      name: products.name,
      priceCents: products.priceCents,
      listPriceCents: products.listPriceCents,
      qty: inventory.quantity,
      categoryName: categories.name,
      parentName: parent,
      brand: brands.name,
      isActive: products.isActive,
      description: products.description,
      highlights: products.highlights,
      keywords: products.keywords,
      images: sql<string | null>`(SELECT string_agg(i."url", ' ' ORDER BY i."position") FROM "product_images" i WHERE i."product_id" = "products"."id")`,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(inventory, eq(inventory.productId, products.id))
    .orderBy(products.partNumber);
  return rows.map((r) => ({
    id: r.id,
    partNumber: r.partNumber,
    name: r.name,
    price: r.priceCents / 100,
    listPrice: r.listPriceCents ? r.listPriceCents / 100 : "",
    qty: r.qty ?? 0,
    category: r.categoryName ? (r.parentName ? `${r.parentName} > ${r.categoryName}` : r.categoryName) : "",
    brand: r.brand ?? "",
    status: r.isActive ? "Active" : "Hidden",
    description: r.description ?? "",
    highlights: r.highlights ?? "",
    keywords: r.keywords ?? "",
    images: r.images ?? "",
  }));
}

function toCsv(rows: SheetRow[]): string {
  const esc = (v: string | number | undefined) => {
    const s = v === undefined ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [SHEET_COLUMNS.map((c) => esc(c.header)).join(",")];
  for (const r of rows) lines.push(SHEET_COLUMNS.map((c) => esc(r[c.key])).join(","));
  // BOM so Excel opens it as UTF-8.
  return `﻿${lines.join("\r\n")}\r\n`;
}

async function toXlsx(rows: SheetRow[], cats: string[], forTemplate: boolean): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Nova A to Z Parts";
  const ws = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = SHEET_COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" } };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  SHEET_COLUMNS.forEach((c, i) => {
    head.getCell(i + 1).note = c.help;
    if (["partNumber", "id"].includes(c.key)) ws.getColumn(i + 1).numFmt = "@";
  });
  for (const r of rows) ws.addRow(r);
  ws.getColumn("price").numFmt = "0.00";
  ws.getColumn("listPrice").numFmt = "0.00";
  for (const k of ["description", "highlights"]) ws.getColumn(k).alignment = { wrapText: true, vertical: "top" };

  const last = Math.max(rows.length + 1, forTemplate ? 2000 : 1) + 500;
  // Range validations (exceljs supports them at runtime but not in its types). Per-cell
  // validations get written as overlapping ranges, which Excel flags as damaged.
  const validations = (ws as unknown as {
    dataValidations: { add(range: string, v: ExcelJS.DataValidation): void };
  }).dataValidations;
  const col = (k: Key) => ws.getColumn(k).letter;
  if (cats.length) {
    validations.add(`${col("category")}2:${col("category")}${last}`, {
      type: "list",
      allowBlank: true,
      formulae: [`Categories!$A$2:$A$${cats.length + 1}`],
    });
  }
  validations.add(`${col("status")}2:${col("status")}${last}`, {
    type: "list",
    allowBlank: true,
    formulae: ['"Active,Hidden"'],
  });

  const cs = wb.addWorksheet("Categories");
  cs.columns = [{ header: "Category (copy into the Category column)", key: "c", width: 70 }];
  cs.getRow(1).font = { bold: true };
  for (const c of cats) cs.addRow({ c });

  const help = wb.addWorksheet("How to use");
  help.columns = [
    { header: "Column", key: "h", width: 16 },
    { header: "What to enter", key: "t", width: 110 },
  ];
  help.getRow(1).font = { bold: true };
  for (const c of SHEET_COLUMNS) help.addRow({ h: c.header, t: c.help });
  help.addRow({});
  for (const t of [
    "Fill one row per part on the Products sheet. Delete the example rows first.",
    "A part number that already exists UPDATES that product; a new part number ADDS a product.",
    "When updating, leave a cell blank to keep the current value; only filled-in cells change.",
    "To edit many existing products: Admin → Products → Bulk Upload → Export all products, change the cells, upload it back.",
    "Upload shows every problem first (row and column); nothing is saved until you press Import.",
  ]) {
    help.addRow({ t });
  }
  help.getColumn("t").alignment = { wrapText: true };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function buildProductSheet(
  kind: "template" | "export",
  format: SheetFormat,
): Promise<{ body: Buffer | string; filename: string; contentType: string }> {
  const rows = kind === "template" ? EXAMPLES : await exportRows();
  const date = new Date().toISOString().slice(0, 10);
  const base = kind === "template" ? "product-upload-template" : `products-export-${date}`;
  if (format === "csv") {
    return { body: toCsv(rows), filename: `${base}.csv`, contentType: "text/csv; charset=utf-8" };
  }
  return {
    body: await toXlsx(rows, await categoryChoices(), kind === "template"),
    filename: `${base}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}
