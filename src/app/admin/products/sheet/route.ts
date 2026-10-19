import { getCurrentUser, isUserAdmin } from "@/lib/auth";
import { buildProductSheet } from "@/lib/product-sheet";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET ?kind=template|export&format=xlsx|csv: the upload template, or every product for bulk editing. */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isUserAdmin(user)) return new Response("Not allowed", { status: 403 });

  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") === "export" ? "export" : "template";
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const { body, filename, contentType } = await buildProductSheet(kind, format);
  return new Response(typeof body === "string" ? body : new Uint8Array(body), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
