/** Normalized product shape used by ProductCard / listings (DB or sample). */
export type ProductCardItem = {
  slug: string;
  name: string;
  brand: string;
  partNumber: string;
  priceCents: number;
  listPriceCents?: number | null;
  ratingAvg: number;
  ratingCount: number;
  inStock: boolean;
  imageUrl?: string | null;
};

export type SortKey = "relevance" | "price-asc" | "price-desc" | "rating" | "newest";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Best Match" },
  { key: "price-asc", label: "Price: Low to High" },
  { key: "price-desc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
  { key: "newest", label: "Newest" },
];

export type BrandFacet = { slug: string; name: string; count: number };

export type ProductListResult = {
  items: ProductCardItem[];
  total: number;
  page: number;
  pageSize: number;
  brandFacets: BrandFacet[];
};
