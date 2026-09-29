// Runs before `next build` on Vercel (package.json "vercel-build"):
//   1. applies pending migrations from ./drizzle (already-applied ones are skipped)
//   2. enables Row Level Security on every public table, so Supabase's public
//      Data API (anon key) can't read or write them; the app connects as the
//      table owner, which bypasses RLS
//   3. seeds brands/categories/vehicles once (seed --catalog-only is a no-op
//      when categories already exist)
// With no database configured (e.g. Preview deploys) it does nothing.
import { spawnSync } from "node:child_process";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

// Prefer the non-pooling (session) URL for DDL; Supabase's pooled URL is transaction mode.
const raw =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!raw) {
  console.log("[vercel-db] No database configured — skipping migrations and seed.");
  process.exit(0);
}

const url = new URL(raw);
url.searchParams.delete("supa");
const connectionString = url.toString();

const client = postgres(connectionString, { max: 1, prepare: false, onnotice: () => {} });
try {
  console.log("[vercel-db] Applying migrations…");
  await migrate(drizzle(client), { migrationsFolder: "./drizzle" });

  console.log("[vercel-db] Enabling row level security on public tables…");
  await client.unsafe(`
    DO $$
    DECLARE t record;
    BEGIN
      FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
      END LOOP;
    END $$;
  `);
} finally {
  await client.end();
}

function runSeed(flag) {
  const r = spawnSync("npx", ["tsx", "src/db/seed.ts", flag], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: connectionString },
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

console.log("[vercel-db] Seeding catalog (first deploy only)…");
runSeed("--catalog-only");

// Opt-in, one-off: set SEED_DEMO_PRODUCTS=1 for a deploy to fill an empty store.
if (process.env.SEED_DEMO_PRODUCTS === "1") {
  console.log("[vercel-db] Adding demo products (only if the store has none)…");
  runSeed("--demo-products");
}
