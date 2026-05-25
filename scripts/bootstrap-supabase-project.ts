#!/usr/bin/env tsx
/**
 * Bootstrap a fresh Supabase project for HERD — TS companion to
 * `scripts/bootstrap-supabase-project.sh`. Same effect (idempotent
 * herd_app role + GRANTs + enable-rls.sql), implemented via `pg`
 * directly so it runs in environments without `psql` installed.
 *
 * Use the `.sh` for human/CI workflows where psql is available.
 * Use this `.ts` from agent-driven flows that already have `pg` in
 * node_modules.
 *
 * Cravado na Sub-etapa 17.0.11 — paga dívida da Sub-etapa 4.
 *
 * Usage:
 *   DIRECT_URL=postgresql://... npx tsx scripts/bootstrap-supabase-project.ts
 */
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { Client } from "pg";

async function main(): Promise<void> {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    console.error("ERROR: DIRECT_URL env var required");
    process.exit(1);
  }

  const masked = directUrl.replace(/:\/\/[^@]*@/, "://***@");
  console.log(`[bootstrap] Connecting to ${masked}...`);

  const password = randomBytes(24).toString("hex");

  const client = new Client({ connectionString: directUrl });
  await client.connect();

  try {
    // 1. Create herd_app role (idempotent).
    const roleExists = await client.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'herd_app'",
    );
    if (roleExists.rows.length === 0) {
      // Password is randomly generated above (no SQL injection vector).
      // CREATE ROLE doesn't accept parameter binding for the password literal.
      await client.query(
        `CREATE ROLE herd_app WITH LOGIN PASSWORD '${password}' NOBYPASSRLS`,
      );
      console.log("[bootstrap] Created herd_app role");
    } else {
      console.log(
        "[bootstrap] herd_app role already exists — keeping existing password",
      );
      console.log(
        "[bootstrap] If you need a new password, ALTER ROLE manually.",
      );
    }

    // 2. GRANTs + ALTER DEFAULT PRIVILEGES (idempotent).
    await client.query("GRANT USAGE ON SCHEMA public TO herd_app");
    await client.query("GRANT ALL ON ALL TABLES IN SCHEMA public TO herd_app");
    await client.query(
      "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO herd_app",
    );
    await client.query(
      "GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO herd_app",
    );
    await client.query(
      "ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO herd_app",
    );
    await client.query(
      "ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO herd_app",
    );
    await client.query(
      "ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO herd_app",
    );

    console.log("[bootstrap] herd_app role + GRANTs applied");
    console.log("");
    if (roleExists.rows.length === 0) {
      console.log("[bootstrap] herd_app password (anote em password manager):");
      console.log(`  ${password}`);
    }
    console.log("");

    // 3. enable-rls.sql (idempotent — defense-in-depth for Supabase PostgREST).
    if (existsSync("scripts/enable-rls.sql")) {
      console.log("[bootstrap] Applying enable-rls.sql...");
      const sql = readFileSync("scripts/enable-rls.sql", "utf8");
      await client.query(sql);
      console.log("[bootstrap] enable-rls.sql applied");
    } else {
      console.warn("WARNING: scripts/enable-rls.sql not found");
    }
  } finally {
    await client.end();
  }

  console.log("");
  console.log("[bootstrap] ✓ Done.");
}

main().catch((err) => {
  console.error("[bootstrap] FATAL:", err);
  process.exit(1);
});
