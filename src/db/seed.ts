import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { sql } from "drizzle-orm";
import { db } from "./index";
import * as s from "./schema";
import { categories as catalogCategories, topBrands } from "../lib/catalog";

/* -------------------------------------------------------------------------- */
/*  Reference data                                                             */
/* -------------------------------------------------------------------------- */

const brandBlurbs: Record<string, string> = {
  bendix: "Air brake systems and active safety technology for commercial vehicles.",
  dana: "Drivetrain, axle, and sealing technologies for heavy-duty applications.",
  fleetguard: "Filtration for engines, fuel, and hydraulic systems.",
  haldex: "Brake and air suspension components for trucks and trailers.",
  meritor: "Axles, brakes, and drivetrain components for commercial fleets.",
  donaldson: "Engine air, fuel, and lube filtration.",
  stemco: "Wheel-end seals, hubs, and bearings for the road.",
  phillips: "Electrical and lighting connection systems for tractor-trailers.",
  grote: "Vehicle safety lighting and visibility products.",
  alliance: "Value-priced all-makes replacement parts.",
  gates: "Belts, hoses, and fluid power products.",
  wabco: "Braking, stability, and air management systems.",
};

// make → [model, yearStart, yearEnd]
const vehicleData: [string, string, number, number][] = [
  ["Freightliner", "Cascadia", 2018, 2024],
  ["Freightliner", "Columbia", 2008, 2018],
  ["Kenworth", "T680", 2013, 2024],
  ["Kenworth", "W900", 2000, 2024],
  ["Peterbilt", "579", 2013, 2024],
  ["Peterbilt", "389", 2007, 2024],
  ["Volvo", "VNL", 2015, 2024],
  ["International", "LT", 2017, 2024],
  ["International", "ProStar", 2008, 2017],
  ["Mack", "Anthem", 2018, 2024],
  ["Western Star", "5700", 2014, 2022],
  ["Ford", "F-650", 2016, 2024],
];

type SeedProduct = {
  slug: string;
  name: string;
  brand: string; // brand slug
  category: string; // leaf category slug
  partNumber: string;
  price: number; // dollars
  list?: number; // dollars
  rating: number;
  reviews: number;
  qty: number;
  desc: string;
  specs: [string, string][];
  fits: string[]; // makes
};

const d = (s: string) =>
  `Heavy-duty replacement engineered for commercial trucks. ${s} Fitment-verified and backed by our 30-day return policy.`;

const productData: SeedProduct[] = [
  // Engine & Drivetrain
  { slug: "fleetguard-fuel-water-sep-fs1280", name: "FS1280 Fuel/Water Separator", brand: "fleetguard", category: "oil-filters", partNumber: "FG-FS1280", price: 24.5, list: 31, rating: 4.9, reviews: 412, qty: 240, desc: d("Spin-on separator protects injectors by removing water and contaminants from diesel fuel."), specs: [["Type", "Fuel/Water Separator"], ["Thread", "1-14 UNS"], ["Micron Rating", "10"]], fits: ["Freightliner", "Kenworth", "Peterbilt"] },
  { slug: "donaldson-primary-air-p181050", name: "P181050 Primary Air Filter", brand: "donaldson", category: "oil-filters", partNumber: "DN-P181050", price: 39.95, rating: 4.8, reviews: 311, qty: 180, desc: d("Radial-seal primary air filter delivers high dust capacity and long service life."), specs: [["Type", "Primary Air"], ["Outer Dia.", '10.9"'], ["Length", '14.5"']], fits: ["Volvo", "Mack", "International"] },
  { slug: "fleetguard-oil-filter-lf9009", name: "LF9009 Lube Spin-On Filter", brand: "fleetguard", category: "oil-filters", partNumber: "FG-LF9009", price: 18.75, list: 22.4, rating: 4.7, reviews: 198, qty: 320, desc: d("Combination full-flow/bypass lube filter for extended drain intervals."), specs: [["Type", "Lube Spin-On"], ["Thread", "1-12 UN"], ["Gasket OD", '3.7"']], fits: ["Freightliner", "Volvo"] },
  { slug: "alliance-water-pump-wp1163", name: "Water Pump Assembly", brand: "alliance", category: "water-pumps", partNumber: "AL-WP1163", price: 142.0, list: 179.0, rating: 4.5, reviews: 64, qty: 45, desc: d("Cast-iron water pump with heavy-duty bearing and pre-installed gasket."), specs: [["Inlet", '1.5"'], ["Impeller", "Cast Iron"], ["Warranty", "1 Year"]], fits: ["International", "Kenworth"] },

  // Brakes, Suspension & Steering
  { slug: "bendix-air-dryer-ad-ip", name: "AD-IP Air Dryer Assembly", brand: "bendix", category: "air-brakes", partNumber: "BX-065225", price: 289.95, list: 349, rating: 4.7, reviews: 128, qty: 38, desc: d("Single-cartridge air dryer removes moisture and oil from the air brake system."), specs: [["Voltage", "12V"], ["Purge Volume", "High"], ["Cartridge", "Replaceable"]], fits: ["Freightliner", "Peterbilt", "Volvo"] },
  { slug: "meritor-brake-shoe-kit-4707", name: "Reman Brake Shoe Kit 4707", brand: "meritor", category: "brake-shoes", partNumber: "MR-KSMG4707", price: 142.0, list: 175, rating: 4.8, reviews: 203, qty: 96, desc: d('Remanufactured 16.5" x 7" brake shoe kit with premium lining and hardware.'), specs: [["Size", '16.5" x 7"'], ["Lining", "Premium"], ["Includes", "Shoes + Hardware"]], fits: ["Freightliner", "Kenworth", "International", "Mack"] },
  { slug: "haldex-slack-adjuster-auto", name: "Automatic Slack Adjuster", brand: "haldex", category: "air-brakes", partNumber: "HX-40010143", price: 47.25, rating: 4.6, reviews: 141, qty: 130, desc: d("Self-adjusting slack adjuster maintains proper brake stroke automatically."), specs: [["Spline", "10"], ['Arm Length', '5.5"'], ["Type", "Automatic"]], fits: ["Volvo", "Peterbilt"] },
  { slug: "alliance-leaf-spring-front", name: "Front Leaf Spring", brand: "alliance", category: "leaf-springs", partNumber: "AL-LS2240", price: 318.0, list: 389, rating: 4.4, reviews: 37, qty: 22, desc: d("Multi-leaf front spring with powder-coated finish for corrosion resistance."), specs: [["Leaves", "4"], ["Capacity", "12,000 lb"], ["Finish", "Powder Coat"]], fits: ["Kenworth", "Peterbilt"] },
  { slug: "meritor-shock-absorber-hd", name: "Heavy-Duty Shock Absorber", brand: "meritor", category: "shocks", partNumber: "MR-M85745", price: 36.9, list: 44, rating: 4.7, reviews: 89, qty: 160, desc: d("Twin-tube gas shock tuned for loaded and unloaded ride control."), specs: [["Type", "Twin-Tube Gas"], ["Mount", "Eye/Eye"], ["Extended", '16.3"']], fits: ["Freightliner", "International"] },

  // Electrical & Lighting
  { slug: "grote-led-stt-lamp-4in", name: 'LED Stop/Tail/Turn Lamp 4"', brand: "grote", category: "led-lights", partNumber: "GR-53992", price: 18.99, rating: 4.6, reviews: 76, qty: 410, desc: d('Sealed 4" round LED lamp with grommet mount and instant-on illumination.'), specs: [["Diameter", '4"'], ["LEDs", "10"], ["Voltage", "12V"]], fits: ["Freightliner", "Kenworth", "Peterbilt", "Volvo"] },
  { slug: "phillips-7way-cord-15ft", name: "7-Way ABS Trailer Cord 15'", brand: "phillips", category: "wiring", partNumber: "PH-30-2050", price: 54.5, list: 67, rating: 4.8, reviews: 152, qty: 95, desc: d("Heavy-duty 7-way cord with weather-sealed plugs for tractor-trailer power."), specs: [["Length", "15 ft"], ["Conductors", "7"], ["Jacket", "Vinyl"]], fits: ["Freightliner", "Mack"] },
  { slug: "grote-led-headlamp-7in", name: '7" LED Headlamp', brand: "grote", category: "led-lights", partNumber: "GR-90951", price: 89.0, list: 109, rating: 4.5, reviews: 58, qty: 70, desc: d('Round 7" LED headlamp with high/low beam and DOT-compliant pattern.'), specs: [["Diameter", '7"'], ["Beam", "Hi/Lo"], ["Lumens", "2200"]], fits: ["Kenworth", "Peterbilt"] },
  { slug: "alliance-alternator-160a", name: "160A Alternator", brand: "alliance", category: "alternators", partNumber: "AL-ALT160", price: 198.5, list: 245, rating: 4.4, reviews: 41, qty: 33, desc: d("Brushless 160-amp alternator for high-demand electrical systems."), specs: [["Output", "160A"], ["Voltage", "12V"], ["Mount", "Pad"]], fits: ["Volvo", "International"] },

  // Belts, Cooling & HVAC
  { slug: "gates-serpentine-belt-k08", name: "Serpentine Belt", brand: "gates", category: "belts", partNumber: "GT-K080820", price: 28.4, rating: 4.8, reviews: 220, qty: 260, desc: d("EPDM serpentine belt resists heat, cracking, and wear for long life."), specs: [["Ribs", "8"], ["Length", '82"'], ["Material", "EPDM"]], fits: ["Freightliner", "Volvo", "International"] },
  { slug: "alliance-radiator-cascadia", name: "Radiator Assembly", brand: "alliance", category: "radiators", partNumber: "AL-RAD8841", price: 612.0, list: 749, rating: 4.3, reviews: 28, qty: 14, desc: d("Aluminum/plastic radiator with high cooling capacity and bolt-on fitment."), specs: [["Core", "Aluminum"], ["Rows", "2"], ["Inlet", '2"']], fits: ["Freightliner"] },
  { slug: "gates-coolant-hose-upper", name: "Upper Coolant Hose", brand: "gates", category: "belts", partNumber: "GT-24560", price: 22.95, rating: 4.6, reviews: 47, qty: 140, desc: d("Molded upper radiator hose with reinforced construction for high temps."), specs: [["Position", "Upper"], ["ID", '2"'], ["Material", "EPDM"]], fits: ["Kenworth", "Peterbilt"] },
  { slug: "bendix-ac-compressor-tu-flo", name: "A/C Compressor", brand: "bendix", category: "ac", partNumber: "BX-AC8842", price: 274.0, list: 329, rating: 4.5, reviews: 52, qty: 26, desc: d("Direct-fit A/C compressor with clutch assembly, ready to install."), specs: [["Clutch", "Included"], ["Grooves", "8"], ["Refrigerant", "R134a"]], fits: ["Volvo", "Mack"] },

  // Transmission & Clutch
  { slug: "dana-clutch-kit-15-5", name: '15.5" Clutch Kit', brand: "dana", category: "clutches", partNumber: "DN-CK155", price: 689.0, list: 845, rating: 4.7, reviews: 73, qty: 18, desc: d('Heavy-duty 15.5" two-plate clutch kit with disc, cover, and bearing.'), specs: [["Size", '15.5"'], ["Plates", "2"], ["Torque", "1850 lb-ft"]], fits: ["Freightliner", "Kenworth", "Peterbilt"] },
  { slug: "dana-u-joint-1810", name: "1810 Series U-Joint", brand: "dana", category: "u-joints", partNumber: "DN-5-281X", price: 41.6, list: 49, rating: 4.8, reviews: 164, qty: 210, desc: d("Greaseable universal joint with full-round bearing caps for driveline service."), specs: [["Series", "1810"], ["Cap Dia.", '1.625"'], ["Greaseable", "Yes"]], fits: ["Volvo", "International", "Mack"] },
  { slug: "alliance-pilot-bearing", name: "Clutch Pilot Bearing", brand: "alliance", category: "bearings", partNumber: "AL-PB330", price: 14.25, rating: 4.6, reviews: 35, qty: 175, desc: d("Sealed pilot bearing supports the transmission input shaft."), specs: [["Type", "Sealed"], ["Bore", '1.378"'], ["OD", '2.835"']], fits: ["Freightliner", "Kenworth"] },

  // Tires & Wheels
  { slug: "stemco-wheel-seal-guardian", name: "Guardian Wheel Seal", brand: "stemco", category: "hubs", partNumber: "ST-393-0271", price: 27.75, rating: 4.7, reviews: 154, qty: 230, desc: d("Unitized wheel seal protects bearings and keeps lubricant in."), specs: [["Type", "Unitized"], ["Position", "Drive/Trailer"], ["Material", "Nitrile"]], fits: ["Freightliner", "Volvo", "International"] },
  { slug: "alliance-lug-nut-flange", name: "Flanged Lug Nut (20-pack)", brand: "alliance", category: "lug-nuts", partNumber: "AL-LN20", price: 32.0, rating: 4.5, reviews: 61, qty: 300, desc: d("Two-piece flanged lug nuts with zinc plating, sold in a 20-pack."), specs: [["Thread", "M22 x 1.5"], ["Qty", "20"], ["Finish", "Zinc"]], fits: ["Kenworth", "Peterbilt", "Mack"] },
  { slug: "stemco-hub-assembly-trailer", name: "Trailer Hub Assembly", brand: "stemco", category: "hubs", partNumber: "ST-HUB572", price: 254.9, list: 309, rating: 4.6, reviews: 44, qty: 28, desc: d("Pre-assembled trailer hub with bearings, seal, and studs installed."), specs: [["Bolt Pattern", "10 x 11.25"], ["Studs", "Included"], ["Position", "Trailer"]], fits: ["Freightliner"] },

  // Body & Cab
  { slug: "alliance-west-coast-mirror", name: "West Coast Mirror Head", brand: "alliance", category: "mirrors", partNumber: "AL-MIR716", price: 38.5, rating: 4.4, reviews: 39, qty: 120, desc: d('Stainless 7" x 16" West Coast mirror head with bracket clamps.'), specs: [["Size", '7" x 16"'], ["Finish", "Stainless"], ["Heated", "No"]], fits: ["Freightliner", "International"] },
  { slug: "grote-cab-marker-amber-5pk", name: "Amber Cab Marker Lights (5-pack)", brand: "grote", category: "led-lights", partNumber: "GR-45253", price: 41.0, list: 52, rating: 4.7, reviews: 88, qty: 150, desc: d("LED cab roof marker lights with amber lenses, complete 5-light set."), specs: [["Color", "Amber"], ["Qty", "5"], ["Mount", "Surface"]], fits: ["Kenworth", "Peterbilt"] },
  { slug: "alliance-wiper-blade-22", name: 'Heavy-Duty Wiper Blade 22"', brand: "alliance", category: "glass", partNumber: "AL-WB22", price: 11.95, rating: 4.5, reviews: 72, qty: 280, desc: d('22" all-season wiper blade with graphite-coated rubber element.'), specs: [["Length", '22"'], ["Connector", "Hook"], ["Season", "All"]], fits: ["Volvo", "Mack", "International"] },

  // Trailer Parts
  { slug: "alliance-landing-gear-2speed", name: "Two-Speed Landing Gear Set", brand: "alliance", category: "landing-gear", partNumber: "AL-LG2S", price: 372.0, list: 449, rating: 4.6, reviews: 51, qty: 24, desc: d("Two-speed landing gear with 50-ton static capacity and weather seals."), specs: [["Capacity", "50 ton"], ["Speed", "2-Speed"], ["Travel", '16.5"']], fits: ["Freightliner", "Kenworth"] },
  { slug: "phillips-trailer-nosebox", name: "Trailer Nosebox", brand: "phillips", category: "trailer-doors", partNumber: "PH-16-7400", price: 64.75, rating: 4.7, reviews: 63, qty: 80, desc: d("Sealed trailer nosebox with circuit breakers protects electrical connections."), specs: [["Breakers", "Included"], ["Sockets", "7-Way"], ["Seal", "Gasketed"]], fits: ["Volvo", "International"] },
  { slug: "haldex-trailer-brake-valve", name: "Trailer ABS Relay Valve", brand: "haldex", category: "trailer-suspension", partNumber: "HX-KN28100", price: 96.4, list: 118, rating: 4.6, reviews: 49, qty: 60, desc: d("Trailer relay valve provides fast, balanced brake application."), specs: [["Crack Pressure", "4 psi"], ["Ports", '3/8" + 1/2"'], ["Mount", "2-Bolt"]], fits: ["Freightliner", "Mack"] },

  // Tools, Chemicals & Supplies
  { slug: "alliance-grease-cartridge-14oz", name: "Heavy-Duty Grease (10-pack)", brand: "alliance", category: "lubricants", partNumber: "AL-GR10", price: 49.9, rating: 4.8, reviews: 134, qty: 200, desc: d("Lithium-complex chassis grease in 14 oz cartridges, case of 10."), specs: [["NLGI", "2"], ["Qty", "10 x 14 oz"], ["Type", "Lithium Complex"]], fits: ["Freightliner", "Kenworth", "Peterbilt", "Volvo"] },
  { slug: "gates-hose-clamp-kit", name: "Stainless Hose Clamp Kit", brand: "gates", category: "fasteners", partNumber: "GT-HCK26", price: 23.5, rating: 4.6, reviews: 57, qty: 240, desc: d("Assorted stainless worm-gear hose clamps in a reusable case."), specs: [["Pieces", "26"], ["Material", "Stainless"], ["Range", '1/2" - 4"']], fits: ["International", "Mack"] },
  { slug: "alliance-def-fluid-25gal", name: "Diesel Exhaust Fluid 2.5 Gal", brand: "alliance", category: "lubricants", partNumber: "AL-DEF25", price: 14.99, rating: 4.9, reviews: 410, qty: 500, desc: d("API-certified DEF for SCR systems, 2.5-gallon jug with pour spout."), specs: [["Volume", "2.5 gal"], ["Standard", "ISO 22241"], ["Spout", "Included"]], fits: ["Freightliner", "Volvo", "International", "Mack"] },
];

/* -------------------------------------------------------------------------- */
/*  Seed                                                                        */
/* -------------------------------------------------------------------------- */

async function main() {
  console.log("⏳ Resetting catalog tables…");
  await db.execute(sql`
    TRUNCATE TABLE
      product_fitment, product_specs, product_images, inventory,
      cart_items, order_items, products, vehicles, brands, categories
    RESTART IDENTITY CASCADE
  `);

  // Brands
  console.log("⏳ Seeding brands…");
  const brandRows = await db
    .insert(s.brands)
    .values(
      topBrands.map((b) => ({
        slug: b.slug,
        name: b.name,
        description: brandBlurbs[b.slug] ?? null,
      })),
    )
    .returning({ id: s.brands.id, slug: s.brands.slug });
  const brandId = new Map(brandRows.map((b) => [b.slug, b.id]));

  // Categories (parents then children)
  console.log("⏳ Seeding categories…");
  const parentRows = await db
    .insert(s.categories)
    .values(
      catalogCategories.map((c, i) => ({
        slug: c.slug,
        name: c.name,
        blurb: c.blurb,
        position: i,
      })),
    )
    .returning({ id: s.categories.id, slug: s.categories.slug });
  const categoryId = new Map(parentRows.map((c) => [c.slug, c.id]));

  const childValues = catalogCategories.flatMap((c) =>
    c.subcategories.map((sub, i) => ({
      slug: sub.slug,
      name: sub.name,
      parentId: categoryId.get(c.slug)!,
      position: i,
    })),
  );
  const childRows = await db
    .insert(s.categories)
    .values(childValues)
    .returning({ id: s.categories.id, slug: s.categories.slug });
  for (const c of childRows) categoryId.set(c.slug, c.id);

  // Vehicles
  console.log("⏳ Seeding vehicles…");
  const vehicleRows = await db
    .insert(s.vehicles)
    .values(
      vehicleData.map(([make, model, yearStart, yearEnd]) => ({
        make,
        model,
        yearStart,
        yearEnd,
      })),
    )
    .returning({ id: s.vehicles.id, make: s.vehicles.make });
  // make → vehicle ids
  const vehiclesByMake = new Map<string, string[]>();
  for (const v of vehicleRows) {
    const list = vehiclesByMake.get(v.make) ?? [];
    list.push(v.id);
    vehiclesByMake.set(v.make, list);
  }

  // Products + dependents
  console.log(`⏳ Seeding ${productData.length} products…`);
  const productRows = await db
    .insert(s.products)
    .values(
      productData.map((p) => ({
        slug: p.slug,
        name: p.name,
        partNumber: p.partNumber,
        brandId: brandId.get(p.brand) ?? null,
        categoryId: categoryId.get(p.category) ?? null,
        description: p.desc,
        priceCents: Math.round(p.price * 100),
        listPriceCents: p.list ? Math.round(p.list * 100) : null,
        ratingAvg: p.rating.toFixed(1),
        ratingCount: p.reviews,
      })),
    )
    .returning({ id: s.products.id, slug: s.products.slug });
  const productId = new Map(productRows.map((p) => [p.slug, p.id]));

  // Specs
  const specValues = productData.flatMap((p) =>
    p.specs.map(([name, value], i) => ({
      productId: productId.get(p.slug)!,
      name,
      value,
      position: i,
    })),
  );
  await db.insert(s.productSpecs).values(specValues);

  // Inventory
  await db.insert(s.inventory).values(
    productData.map((p) => ({
      productId: productId.get(p.slug)!,
      quantity: p.qty,
      warehouse: "Dallas, TX",
    })),
  );

  // Fitment
  const fitmentValues = productData.flatMap((p) =>
    p.fits.flatMap((make) =>
      (vehiclesByMake.get(make) ?? []).map((vehicleId) => ({
        productId: productId.get(p.slug)!,
        vehicleId,
      })),
    ),
  );
  await db.insert(s.productFitment).values(fitmentValues);

  console.log("✅ Seed complete:");
  console.log(`   ${brandRows.length} brands`);
  console.log(`   ${parentRows.length} categories + ${childRows.length} subcategories`);
  console.log(`   ${vehicleRows.length} vehicles`);
  console.log(`   ${productRows.length} products`);
  console.log(`   ${specValues.length} specs, ${fitmentValues.length} fitment links`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
