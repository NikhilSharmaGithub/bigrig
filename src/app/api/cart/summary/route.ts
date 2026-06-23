import { NextResponse } from "next/server";
import { getCartCount } from "@/lib/cart";

// Resilient: returns 0 when the DB isn't configured so the header still renders.
export async function GET() {
  try {
    const count = await getCartCount();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
