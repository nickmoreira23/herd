import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate config for integration tests that require a live database.
// Run via `npm run test:ledger`. Requires DATABASE_URL or DIRECT_URL env var
// pointing at a Postgres database with all migrations applied.
//
// Naming convention: integration tests use `*.integration.test.ts`. The
// default vitest config excludes that pattern so `npm test` (and CI) does
// not need a database. This config matches only that pattern.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.integration.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    setupFiles: ["dotenv/config"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
