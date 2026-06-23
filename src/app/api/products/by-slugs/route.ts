import { NextResponse, type NextRequest } from "next/server";
import { getProductCardsBySlugs } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (slugs.length === 0) return NextResponse.json({ items: [] });

  try {
    const items = await getProductCardsBySlugs(slugs);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
