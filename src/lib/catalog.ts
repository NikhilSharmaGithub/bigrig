/**
 * Catalog taxonomy + reference data for Big Rig Components.
 * Phase 0: static placeholder data to drive nav and homepage.
 * Phase 1+: this is replaced/seeded into the database.
 */

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  subcategories: { slug: string; name: string }[];
};

export const categories: Category[] = [
  {
    slug: "engine-drivetrain",
    name: "Engine & Drivetrain",
    blurb: "Filters, gaskets, valves, pistons, turbo & fuel system",
    subcategories: [
      { slug: "oil-filters", name: "Oil & Fuel Filters" },
      { slug: "gaskets-seals", name: "Gaskets & Seals" },
      { slug: "turbochargers", name: "Turbochargers" },
      { slug: "fuel-system", name: "Fuel System" },
      { slug: "engine-mounts", name: "Engine Mounts" },
    ],
  },
  {
    slug: "brakes-suspension-steering",
    name: "Brakes, Suspension & Steering",
    blurb: "Air brakes, drums, springs, shocks, kingpins",
    subcategories: [
      { slug: "brake-shoes", name: "Brake Shoes & Drums" },
      { slug: "air-brakes", name: "Air Brake Valves" },
      { slug: "leaf-springs", name: "Leaf Springs" },
      { slug: "shocks", name: "Shock Absorbers" },
      { slug: "steering", name: "Steering Components" },
    ],
  },
  {
    slug: "electrical-lighting",
    name: "Electrical & Lighting",
    blurb: "LED lamps, harnesses, connectors, batteries",
    subcategories: [
      { slug: "led-lights", name: "LED Lighting" },
      { slug: "wiring", name: "Wiring & Harnesses" },
      { slug: "batteries", name: "Batteries" },
      { slug: "alternators", name: "Alternators & Starters" },
      { slug: "switches", name: "Switches & Sensors" },
    ],
  },
  {
    slug: "cooling-hvac",
    name: "Belts, Cooling & HVAC",
    blurb: "Radiators, fans, A/C, belts & hoses",
    subcategories: [
      { slug: "radiators", name: "Radiators" },
      { slug: "fans", name: "Fan Clutches & Blades" },
      { slug: "ac", name: "A/C Compressors" },
      { slug: "belts", name: "Belts & Hoses" },
      { slug: "water-pumps", name: "Water Pumps" },
    ],
  },
  {
    slug: "transmission",
    name: "Transmission & Clutch",
    blurb: "Clutches, shift kits, bearings, fasteners",
    subcategories: [
      { slug: "clutches", name: "Clutches" },
      { slug: "shift-kits", name: "Shift Kits" },
      { slug: "bearings", name: "Bearings" },
      { slug: "u-joints", name: "U-Joints & Driveline" },
    ],
  },
  {
    slug: "tires-wheels",
    name: "Tires & Wheels",
    blurb: "Wheels, hubs, TPMS sensors, hardware",
    subcategories: [
      { slug: "wheels", name: "Wheels & Rims" },
      { slug: "hubs", name: "Hubs & Bearings" },
      { slug: "tpms", name: "TPMS Sensors" },
      { slug: "lug-nuts", name: "Lug Nuts & Studs" },
    ],
  },
  {
    slug: "body-cab",
    name: "Body & Cab",
    blurb: "Mirrors, doors, fenders, seats, glass",
    subcategories: [
      { slug: "mirrors", name: "Mirrors" },
      { slug: "fenders", name: "Fenders & Bumpers" },
      { slug: "doors", name: "Doors & Hardware" },
      { slug: "seats", name: "Seats" },
      { slug: "glass", name: "Glass & Wipers" },
    ],
  },
  {
    slug: "trailer",
    name: "Trailer Parts",
    blurb: "Landing gear, doors, suspension, ramps",
    subcategories: [
      { slug: "landing-gear", name: "Landing Gear" },
      { slug: "trailer-doors", name: "Doors & Hardware" },
      { slug: "trailer-suspension", name: "Trailer Suspension" },
      { slug: "couplers", name: "Couplers & Hitches" },
    ],
  },
  {
    slug: "tools-supplies",
    name: "Tools, Chemicals & Supplies",
    blurb: "Hand tools, lubricants, cleaners, fasteners",
    subcategories: [
      { slug: "hand-tools", name: "Hand Tools" },
      { slug: "lubricants", name: "Lubricants & Fluids" },
      { slug: "cleaners", name: "Cleaners & Chemicals" },
      { slug: "fasteners", name: "Fasteners & Hardware" },
    ],
  },
];

export const topBrands: { slug: string; name: string }[] = [
  { slug: "bendix", name: "Bendix" },
  { slug: "dana", name: "Dana" },
  { slug: "fleetguard", name: "Fleetguard" },
  { slug: "haldex", name: "Haldex" },
  { slug: "meritor", name: "Meritor" },
  { slug: "donaldson", name: "Donaldson" },
  { slug: "stemco", name: "Stemco" },
  { slug: "phillips", name: "Phillips" },
  { slug: "grote", name: "Grote" },
  { slug: "alliance", name: "Alliance" },
  { slug: "gates", name: "Gates" },
  { slug: "wabco", name: "WABCO" },
];

export const truckMakes: string[] = [
  "Freightliner",
  "Kenworth",
  "Peterbilt",
  "Volvo",
  "International",
  "Mack",
  "Western Star",
  "Ford",
];
