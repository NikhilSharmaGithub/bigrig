import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't pick up a stray lockfile elsewhere.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Spreadsheet uploads (Admin → Products → Bulk Upload) go through a server action.
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
