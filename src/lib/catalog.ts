/**
 * Catalog taxonomy + reference data for Nova A to Z Parts.
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
    slug: "pumps-motors",
    name: "Pumps & Motors",
    blurb: "Hydraulic pumps, power steering & motor assemblies",
    subcategories: [],
  },
  {
    slug: "pto-assemblies",
    name: "Power Take Off (PTO) Assemblies",
    blurb: "Chelsea, Muncie & heavy-duty PTO units",
    subcategories: [],
  },
  {
    slug: "brake-components",
    name: "Brake Components",
    blurb: "Air brake valves, shoes, drums & adjusters",
    subcategories: [],
  },
  {
    slug: "differential-bearing-kits",
    name: "Differential Bearing Kits",
    blurb: "Complete overhaul kits, bearings & seals",
    subcategories: [],
  },
  {
    slug: "air-brake-chambers",
    name: "Air Brake Chambers",
    blurb: "Spring brakes, service chambers & hardware",
    subcategories: [],
  },
  {
    slug: "air-springs-bags",
    name: "Air Springs/Bags",
    blurb: "Cabin & suspension air springs",
    subcategories: [],
  },
  {
    slug: "differential-carriers",
    name: "Differential Carriers",
    blurb: "Front, rear & inter-axle differentials",
    subcategories: [],
  },
  {
    slug: "air-dryers-cartridges",
    name: "Air Dryers and Cartridges",
    blurb: "Desiccant cartridges, AD-9 & AD-IP units",
    subcategories: [],
  },
  {
    slug: "end-yokes-pinion-yokes",
    name: "End Yokes/Pinion Yokes",
    blurb: "Full-round, half-round & companion flanges",
    subcategories: [],
  },
  {
    slug: "air-brake-valves",
    name: "Air Brake Valves",
    blurb: "Purge valves, relay valves & protection valves",
    subcategories: [],
  },
  {
    slug: "cooling-system-parts",
    name: "Cooling System Parts",
    blurb: "Radiators, charge air coolers & water pumps",
    subcategories: [],
  },
  {
    slug: "countershafts-gears",
    name: "Countershafts & Gears",
    blurb: "Eaton transmission gears & countershafts",
    subcategories: [],
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
  { slug: "freightliner", name: "Freightliner" },
  { slug: "kenworth", name: "Kenworth" },
  { slug: "peterbilt", name: "Peterbilt" },
  { slug: "volvo", name: "Volvo" },
  { slug: "international", name: "International" },
  { slug: "mack", name: "Mack" },
  { slug: "western-star", name: "Western Star" },
  { slug: "ford", name: "Ford" },
].map(m => m.name);
