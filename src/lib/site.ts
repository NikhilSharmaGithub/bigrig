/** Site-wide constants used for SEO, structured data, and contact info. */

export const SITE = {
  name: "Nova A to Z Parts",
  shortName: "Nova",
  tagline: "Heavy-Duty Truck & Trailer Parts",
  description:
    "Heavy-duty truck and trailer parts — A to Z — with live stock levels, fitment listed by truck, fast shipping, and 30-day hassle-free returns.",
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  email: "support@novaatozparts.com",
  address: {
    line1: "4200 Freightway Blvd",
    city: "Dallas",
    state: "TX",
    postalCode: "75201",
    country: "US",
  },
} as const;
