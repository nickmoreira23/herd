import { defineConfig } from "vitest/config";
import path from "node:path";

// Separate config for ledger integration tests.
// Run via `npm run test:ledger`. Requires DATABASE_URL or DIRECT_URL env var
// pointing at a Postgres database with the ledger_core migration applied.
//
// Why a separate config: the default vitest config excludes `src/lib/ledger/**`
// so `npm test` (and CI) does not need a database. This config does not
// exclude the ledger paths and only matches them.
export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/lib/ledger/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    setupFiles: ["dotenv/config"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
