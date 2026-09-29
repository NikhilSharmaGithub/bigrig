import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// Reuse the client across hot reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as {
  client?: ReturnType<typeof postgres>;
  db?: DrizzleDb;
};

/**
 * DATABASE_URL wins; otherwise POSTGRES_URL, which the Supabase ↔ Vercel
 * integration syncs into the project. That URL carries `supa=base-pooler.x`,
 * which postgres-js would forward to the server as a startup parameter.
 */
function connectionUrl(): string | undefined {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) return undefined;
  const url = new URL(raw);
  url.searchParams.delete("supa");
  return url.toString();
}

function createDb(): DrizzleDb {
  const connectionString = connectionUrl();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example).",
    );
  }
  const client =
    globalForDb.client ?? postgres(connectionString, { prepare: false });
  if (process.env.NODE_ENV !== "production") globalForDb.client = client;
  return drizzle(client, { schema });
}

/**
 * Lazy db proxy: importing this module never connects or throws. The first
 * actual query triggers the connection, so a missing DATABASE_URL surfaces as
 * a catchable runtime error (not a module-load crash). This keeps resilient
 * routes — e.g. the cart-count endpoint — able to fall back gracefully.
 */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const instance = (globalForDb.db ??= createDb());
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export { schema };
