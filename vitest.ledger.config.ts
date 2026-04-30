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
    // Integration tests run against the remote Supabase pooler; per-test
    // round-trip latency is non-trivial. Bump from the 5s default so suites
    // that batch many sequential calls (e.g. seed twice = 40 round-trips)
    // don't flake on slower network days.
    testTimeout: 30000,
    // Serialize integration test files. Some suites share global tables
    // (e.g. domain_events) and parallel execution causes one suite's worker
    // to consume rows another suite's beforeAll just created. Network
    // latency to Supabase already serializes execution effectively; this
    // makes the ordering explicit. Vitest 4 syntax — replaces the deprecated
    // `poolOptions.threads.singleThread`.
    fileParallelism: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
