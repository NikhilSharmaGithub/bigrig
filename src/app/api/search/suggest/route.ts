import { NextResponse, type NextRequest } from "next/server";
import { listProducts } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ items: [] });

  try {
    const result = await listProducts({ q, page: 1, pageSize: 6 });
    const items = result.items.map((i) => ({
      slug: i.slug,
      name: i.name,
      brand: i.brand,
      partNumber: i.partNumber,
      priceCents: i.priceCents,
      imageUrl: i.imageUrl ?? null,
    }));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
