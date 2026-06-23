import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { SITE } from "@/lib/site";

export const revalidate = 3600;

const STATIC_PATHS = [
  "",
  "/c",
  "/brands",
  "/vehicle",
  "/deals",
  "/about",
  "/pro",
  "/financing",
  "/help",
  "/shipping",
  "/returns",
  "/contact",
  "/privacy",
  "/terms",
  "/careers",
  "/track",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    (p): MetadataRoute.Sitemap[number] => ({
      url: `${base}${p}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: p === "" ? 1 : 0.6,
    }),
  );

  let dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const allCats = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        parentId: categories.parentId,
      })
      .from(categories);
    const slugById = new Map(allCats.map((c) => [c.id, c.slug]));

    const catEntries = allCats.map(
      (c): MetadataRoute.Sitemap[number] => ({
        url: c.parentId
          ? `${base}/c/${slugById.get(c.parentId)}/${c.slug}`
          : `${base}/c/${c.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    );

    const prods = await db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, true));
    const productEntries = prods.map(
      (p): MetadataRoute.Sitemap[number] => ({
        url: `${base}/p/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      }),
    );

    dynamicEntries = [...catEntries, ...productEntries];
  } catch {
    // No DB yet — ship the static sitemap.
  }

  return [...staticEntries, ...dynamicEntries];
}
