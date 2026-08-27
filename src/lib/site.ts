/** Site-wide constants used for SEO, structured data, and contact info. */

export const SITE = {
  name: "Nova A to Z Parts",
  shortName: "Nova",
  tagline: "Heavy-Duty Truck & Trailer Parts",
  description:
    "Shop millions of heavy-duty truck and trailer parts — A to Z — with real-time inventory, fast shipping, and 30-day hassle-free returns. Fitment-verified for your rig.",
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  phone: "1-888-000-6682",
  phoneHref: "tel:+18880006682",
  email: "support@novaatozparts.com",
  address: {
    line1: "4200 Freightway Blvd",
    city: "Dallas",
    state: "TX",
    postalCode: "75201",
    country: "US",
  },
} as const;
