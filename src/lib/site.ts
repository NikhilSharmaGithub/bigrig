/** Site-wide constants used for SEO, structured data, and contact info. */

export const SITE = {
  name: "Big Rig Components",
  shortName: "BRC",
  tagline: "Heavy-Duty Truck & Trailer Parts",
  description:
    "Shop millions of heavy-duty truck and trailer parts with real-time inventory, fast shipping, and 30-day hassle-free returns. Fitment-verified for your rig.",
  url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
  phone: "1-800-555-1234",
  phoneHref: "tel:+18005551234",
  email: "support@bigrigcomponents.com",
  address: {
    line1: "4200 Freightway Blvd",
    city: "Dallas",
    state: "TX",
    postalCode: "75201",
    country: "US",
  },
} as const;
