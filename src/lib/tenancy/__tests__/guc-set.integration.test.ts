import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Sub-etapa 4, Tarefa 2 — GUC primitive verification.
 *
 * Confirms the Postgres primitive used by the Prisma Extension:
 * `SELECT set_config('app.tenant_id', <uuid>, true)` inside a `$transaction`
 * is readable via `current_setting('app.tenant_id', true)` in the same
 * transaction. This is the building block; the Extension orchestrates it
 * around tenant-scoped model operations (see `prisma-extension.ts`).
 *
 * End-to-end verification of the full Extension+GUC+RLS chain lives in
 * `rls-breach.integration.test.ts` (Tarefa F). If the breach test passes,
 * the Extension is correctly setting the GUC in production-shaped flows.
 *
 * This test is intentionally lightweight — no DDL, no model operations — so
 * it runs without requiring CREATE privilege or RLS policies in place. It
 * verifies the *primitive* the Extension relies on, not the Extension itself.
 */

// Sub-etapa 4: prefer RUNTIME_DATABASE_URL (herd_app, NOBYPASSRLS) to exercise
// the same connection role as the production singleton. Falls back to DIRECT_URL
// for environments not yet split.
const runtimeUrl = process.env.RUNTIME_DATABASE_URL ?? process.env.DIRECT_URL;
if (!runtimeUrl)
  throw new Error("RUNTIME_DATABASE_URL or DIRECT_URL required");

const runtimeClient = new PrismaClient({
  adapter: new PrismaPg(runtimeUrl),
});

describe("Postgres GUC primitive (set_config + current_setting in $transaction)", () => {
  afterAll(async () => {
    await runtimeClient.$disconnect();
  });

  it("SET LOCAL via set_config is observable inside the same transaction", async () => {
    const TEST_UUID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    const observed = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${TEST_UUID}, true)`;
      const rows = await tx.$queryRaw<Array<{ value: string }>>`
        SELECT current_setting('app.tenant_id', true) AS value
      `;
      return rows[0]?.value ?? null;
    });

    expect(observed).toBe(TEST_UUID);
  });

  it("GUC is scoped to the transaction — leaks NOT visible outside", async () => {
    const TEST_UUID = "11111111-2222-3333-4444-555555555555";

    await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${TEST_UUID}, true)`;
    });

    // After the transaction closes, set_config(..., true) (is_local=true) must
    // not leak to the next operation on the (potentially pooled) connection.
    // current_setting(..., true) (missing_ok=true) returns '' when not set.
    const rows = await runtimeClient.$queryRaw<Array<{ value: string }>>`
      SELECT current_setting('app.tenant_id', true) AS value
    `;
    expect(rows[0].value).toBe("");
  });

  it("current_app_tenant_id() helper reads the GUC (RLS policy backbone)", async () => {
    const TEST_UUID = "99999999-8888-7777-6666-555555555555";

    const observed = await runtimeClient.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${TEST_UUID}, true)`;
      const rows = await tx.$queryRaw<Array<{ value: string }>>`
        SELECT current_app_tenant_id() AS value
      `;
      return rows[0]?.value ?? null;
    });

    expect(observed).toBe(TEST_UUID);
  });
});
