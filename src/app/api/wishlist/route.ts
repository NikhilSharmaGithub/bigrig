import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getWishlistSlugs } from "@/lib/wishlist";

// Returns the current user's wishlisted slugs (empty when logged out / no DB).
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ slugs: [], count: 0, authed: false });
    const slugs = await getWishlistSlugs(user.id);
    return NextResponse.json({ slugs, count: slugs.length, authed: true });
  } catch {
    return NextResponse.json({ slugs: [], count: 0, authed: false });
  }
}
