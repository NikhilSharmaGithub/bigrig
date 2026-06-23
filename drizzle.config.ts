import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js loads .env.local for the app; load it here for CLI tooling too.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
