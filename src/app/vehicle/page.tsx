import Link from "next/link";
import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { Breadcrumbs } from "@/components/catalog/Breadcrumbs";
import {
  flattenParams,
  parseListOpts,
  type RawSearchParams,
} from "@/lib/catalog-params";
import {
  getVehicleById,
  getVehicleMakes,
  getVehiclesForMake,
  listProducts,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Shop by Vehicle",
  description: "Find parts guaranteed to fit your truck by make, model, and year.",
};

type Props = { searchParams: Promise<RawSearchParams> };

export default async function VehiclePage({ searchParams }: Props) {
  const sp = flattenParams(await searchParams);
  const { make, vehicle } = sp;

  // Step 3 — vehicle chosen: show fitted parts.
  if (vehicle) {
    const v = await getVehicleById(vehicle);
    if (v) {
      const result = await listProducts(parseListOpts(sp, { vehicleId: v.id }));
      const years =
        v.yearStart && v.yearEnd ? ` (${v.yearStart}–${v.yearEnd})` : "";
      return (
        <CatalogView
          title={`${v.make} ${v.model}${years}`}
          description="Parts verified to fit this vehicle"
          breadcrumbs={[
            { label: "Shop by Vehicle", href: "/vehicle" },
            { label: v.make, href: `/vehicle?make=${encodeURIComponent(v.make)}` },
            { label: `${v.model}${years}` },
          ]}
          result={result}
          searchParams={sp}
          basePath={`/vehicle?make=${encodeURIComponent(v.make)}&vehicle=${v.id}`}
        />
      );
    }
  }

  // Step 2 — make chosen: list models.
  if (make) {
    const list = await getVehiclesForMake(make);
    return (
      <Finder
        crumbs={[{ label: "Shop by Vehicle", href: "/vehicle" }, { label: make }]}
        title={`${make} — Select Your Model`}
      >
        {list.length === 0 ? (
          <p className="text-steel-500">No models found for {make}.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((v) => (
              <Link
                key={v.id}
                href={`/vehicle?make=${encodeURIComponent(make)}&vehicle=${v.id}`}
                className="rounded-lg border border-border bg-white p-4 text-center transition-all hover:border-brand hover:shadow-md"
              >
                <span className="font-display block font-bold text-steel-900">
                  {v.model}
                </span>
                {v.yearStart && v.yearEnd && (
                  <span className="text-xs text-steel-500">
                    {v.yearStart}–{v.yearEnd}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </Finder>
    );
  }

  // Step 1 — choose make.
  const makes = await getVehicleMakes();
  return (
    <Finder
      crumbs={[{ label: "Shop by Vehicle" }]}
      title="Shop by Vehicle"
      subtitle="Select your truck make to find parts guaranteed to fit."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {makes.map((m) => (
          <Link
            key={m}
            href={`/vehicle?make=${encodeURIComponent(m)}`}
            className="font-display rounded-lg border border-border bg-white p-5 text-center text-lg font-bold text-steel-800 transition-all hover:border-brand hover:text-brand hover:shadow-md"
          >
            {m}
          </Link>
        ))}
      </div>
    </Finder>
  );
}

function Finder({
  crumbs,
  title,
  subtitle,
  children,
}: {
  crumbs: { label: string; href?: string }[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Breadcrumbs items={crumbs} />
      <div className="mt-4 border-b-2 border-steel-900 pb-3">
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide text-steel-900">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-steel-500">{subtitle}</p>}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
