/**
 * Brand logos for Nova A to Z Parts.
 * Placeholder for backend image storage.
 * Each logo should be stored in the public/brands/ directory.
 */

export type BrandLogo = {
  slug: string;
  name: string;
  imagePath: string; // Path to logo image in public/brands/
};

// Placeholder for brand logos
// Add your actual logo paths here when images are uploaded

export const brandLogos: BrandLogo[] = [
  { slug: "bendix", name: "Bendix", imagePath: "" },
  { slug: "dana", name: "Dana", imagePath: "" },
  { slug: "fleetguard", name: "Fleetguard", imagePath: "" },
  { slug: "haldex", name: "Haldex", imagePath: "" },
  { slug: "meritor", name: "Meritor", imagePath: "" },
  { slug: "donaldson", name: "Donaldson", imagePath: "" },
];