import type { ProductCardItem } from "@/lib/types";

/**
 * Placeholder featured products for the homepage before the DB is connected.
 * Once seeded, the homepage pulls real top-sellers from the database.
 */
export const featuredProducts: ProductCardItem[] = [
  {
    slug: "bendix-air-dryer-ad-ip",
    name: "AD-IP Air Dryer Assembly",
    brand: "Bendix",
    partNumber: "BX-065225",
    priceCents: 28995,
    listPriceCents: 34900,
    ratingAvg: 4.7,
    ratingCount: 128,
    inStock: true,
  },
  {
    slug: "fleetguard-fuel-water-sep-fs1280",
    name: "FS1280 Fuel/Water Separator",
    brand: "Fleetguard",
    partNumber: "FG-FS1280",
    priceCents: 2450,
    listPriceCents: 3100,
    ratingAvg: 4.9,
    ratingCount: 412,
    inStock: true,
  },
  {
    slug: "grote-led-stt-lamp-4in",
    name: 'LED Stop/Tail/Turn Lamp 4"',
    brand: "Grote",
    partNumber: "GR-53992",
    priceCents: 1899,
    ratingAvg: 4.6,
    ratingCount: 76,
    inStock: true,
  },
  {
    slug: "meritor-brake-shoe-kit-4707",
    name: "Reman Brake Shoe Kit 4707",
    brand: "Meritor",
    partNumber: "MR-KSMG4707",
    priceCents: 14200,
    listPriceCents: 17500,
    ratingAvg: 4.8,
    ratingCount: 203,
    inStock: true,
  },
  {
    slug: "donaldson-primary-air-p181050",
    name: "P181050 Primary Air Filter",
    brand: "Donaldson",
    partNumber: "DN-P181050",
    priceCents: 3995,
    ratingAvg: 4.8,
    ratingCount: 311,
    inStock: true,
  },
  {
    slug: "stemco-wheel-seal-guardian",
    name: "Guardian Wheel Seal",
    brand: "Stemco",
    partNumber: "ST-393-0271",
    priceCents: 2775,
    ratingAvg: 4.7,
    ratingCount: 154,
    inStock: true,
  },
];
