#!/usr/bin/env tsx
import "dotenv/config";

import { createHash } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Sub-etapa 17.0.8 — Camada 1 smoke validator (one-shot, idempotent).
 *
 * Paridade with `validate-camada-2-smoke.ts` (Sub-etapa 17.0.3) — same
 * 6-check structure, swapped to Recharge:
 *   1. Env vars present (RECHARGE_API_KEY, RECHARGE_WEBHOOK_SECRET,
 *      ENCRYPTION_KEY, DATABASE_URL, CRON_SECRET).
 *   2. Integration row Recharge exists + credentials decrypt.
 *   3. MemberConnection Recharge present (≥1 row).
 *   4. RechargeService.testConnection (/shop ping).
 *   5. Webhook delivery (POST hardcoded charge/created → 200) signed
 *      with the canonical `sha256(secret + body)` literal (NOT HMAC).
 *   6. Outbox processing (drives the cron itself with local CRON_SECRET
 *      — same pattern as Sub-etapa 17.0.5).
 *
 * Usage:
 *   npm run smoke:camada-1
 *   npm run smoke:camada-1 -- --base-url=https://herd-production.up.railway.app
 */

interface Args {
  baseUrl: string;
  verbose: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Partial<Args> = { verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg.startsWith("--base-url=")) args.baseUrl = arg.slice("--base-url=".length);
    else if (arg === "--base-url" && argv[i + 1]) args.baseUrl = argv[++i]!;
    else if (arg === "--verbose" || arg === "-v") args.verbose = true;
  }
  if (!args.baseUrl) args.baseUrl = "http://localhost:3000";
  return args as Args;
}

function makeAdminClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!url) {
    throw new Error("DATABASE_URL or DIRECT_URL required in env");
  }
  return new PrismaClient({ adapter: new PrismaPg(url) });
}

interface CheckResult {
  name: string;
  ok: boolean;
  detail?: string;
  error?: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const results: CheckResult[] = [];
  let passCount = 0;
  let failCount = 0;
  const log = (msg: string) => console.log(`[validate-camada-1-smoke] ${msg}`);

  log(`Starting smoke validation against ${args.baseUrl}`);
  log("");

  const prisma = makeAdminClient();

  // === Check 1: env vars present ===
  {
    const required = [
      "RECHARGE_API_KEY",
      "RECHARGE_WEBHOOK_SECRET",
      "ENCRYPTION_KEY",
      "DATABASE_URL",
      "CRON_SECRET", // Check 6 drives the cron route itself.
    ];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      results.push({
        name: "env vars present",
        ok: false,
        error: `Missing: ${missing.join(", ")}`,
      });
      failCount++;
    } else {
      results.push({
        name: "env vars present",
        ok: true,
        detail: `${required.length} vars OK`,
      });
      passCount++;
    }
  }

  // === Check 2: Integration row Recharge + credentials decrypt ===
  let integrationId: string | null = null;
  {
    try {
      const integration = await prisma.integration.findUnique({
        where: { slug: "recharge" },
        select: { id: true, status: true, authType: true, credentials: true },
      });

      if (!integration) {
        results.push({
          name: "Integration row Recharge",
          ok: false,
          error: "Not found. Run: npm run seed:recharge",
        });
        failCount++;
      } else {
        integrationId = integration.id;
        if (!integration.credentials) {
          results.push({
            name: "Integration credentials decrypt",
            ok: false,
            error: "credentials column is null",
          });
          failCount++;
        } else {
          try {
            const { decrypt } = await import("@/lib/encryption");
            const decrypted = decrypt(integration.credentials);
            const parsed = JSON.parse(decrypted);
            if (parsed.apiToken) {
              results.push({
                name: "Integration credentials decrypt",
                ok: true,
                detail: `apiToken present (length=${String(parsed.apiToken).length})`,
              });
              passCount++;
            } else {
              results.push({
                name: "Integration credentials decrypt",
                ok: false,
                error: "Missing apiToken in decrypted blob",
              });
              failCount++;
            }
          } catch (err) {
            results.push({
              name: "Integration credentials decrypt",
              ok: false,
              error: `Decrypt failed: ${(err as Error).message}. Check ENCRYPTION_KEY drift (.env vs .env.local).`,
            });
            failCount++;
          }
        }
      }
    } catch (err) {
      results.push({
        name: "Integration row Recharge",
        ok: false,
        error: (err as Error).message,
      });
      failCount++;
    }
  }

  // === Check 3: MemberConnection Recharge ===
  if (integrationId) {
    const connections = await prisma.memberConnection.findMany({
      where: { integrationId },
      select: { id: true, externalUserId: true, tenantId: true },
    });

    if (connections.length === 0) {
      results.push({
        name: "MemberConnection Recharge",
        ok: false,
        error:
          "No connections. Run: npm run seed:recharge-connection -- --tenant=<orgId> --profile=<profileId>",
      });
      failCount++;
    } else if (connections.length === 1) {
      results.push({
        name: "MemberConnection Recharge",
        ok: true,
        detail: `1 connection (V1 fallback compatible), id=${connections[0]!.id.slice(0, 8)}...`,
      });
      passCount++;
    } else {
      results.push({
        name: "MemberConnection Recharge",
        ok: true,
        detail: `${connections.length} connections (multi-tenant)`,
      });
      passCount++;
    }
  } else {
    results.push({
      name: "MemberConnection Recharge",
      ok: false,
      error: "Skipped (Integration row missing)",
    });
    failCount++;
  }

  // === Check 4: RechargeService.testConnection ===
  {
    try {
      const { RechargeService } = await import("@/lib/services/recharge");
      const svc = await RechargeService.fromIntegration();
      const result = await svc.testConnection();
      if (result.shop) {
        results.push({
          name: "RechargeService.testConnection",
          ok: true,
          detail: `shop=${result.shop} email=${result.email}`,
        });
        passCount++;
      } else {
        results.push({
          name: "RechargeService.testConnection",
          ok: false,
          error: "shop missing from /shop response",
        });
        failCount++;
      }
    } catch (err) {
      results.push({
        name: "RechargeService.testConnection",
        ok: false,
        error: (err as Error).message,
      });
      failCount++;
    }
  }

  // === Check 5: Webhook delivery (charge/created, sha256(secret+body)) ===
  let webhookSucceeded = false;
  {
    try {
      const secret = process.env.RECHARGE_WEBHOOK_SECRET!;
      const now = new Date().toISOString();
      const eventId = Date.now();
      // Sub-etapa 17.0.10 — Recharge `charge/*` webhook payload is FLAT.
      // The route handler casts `body as RechargeChargePayload` and the
      // handler reads `body.customer.first_name` directly. Earlier
      // fixtures wrapping under `{charge: {...}}` produced
      // `Cannot read properties of undefined (reading 'first_name')`
      // in the outbox handler. See `src/lib/mappers/recharge/types.ts`
      // `RechargeChargePayload` for the canonical shape.
      const payload = {
        id: eventId,
        customer: {
          id: 999000001,
          email: "smoke-test@comecaai.example",
          first_name: "Smoke",
          last_name: "Test",
        },
        status: "queued",
        total_price: "59.99",
        currency: "USD",
        scheduled_at: now,
        processed_at: null,
        created_at: now,
        updated_at: now,
        line_items: [
          {
            subscription_id: null,
            title: `validate_smoke_${Date.now()}`,
            quantity: 1,
            price: "59.99",
          },
        ],
      };
      const body = JSON.stringify(payload);
      // Canonical: sha256(secret + body) hex literal. NOT HMAC.
      const signature = createHash("sha256")
        .update(secret + body)
        .digest("hex");

      const targetUrl = `${args.baseUrl.replace(/\/$/, "")}/api/webhooks/recharge`;
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Recharge-Hmac-Sha256": signature,
          "X-Recharge-Topic": "charge/created",
        },
        body,
      });

      const responseBody = await response.text();
      if (response.status === 200) {
        webhookSucceeded = true;
        results.push({
          name: "Webhook delivery",
          ok: true,
          detail: `200, body: ${responseBody.slice(0, 80)}`,
        });
        passCount++;
      } else {
        results.push({
          name: "Webhook delivery",
          ok: false,
          error: `status=${response.status}, body: ${responseBody.slice(0, 200)}`,
        });
        failCount++;
      }
    } catch (err) {
      results.push({
        name: "Webhook delivery",
        ok: false,
        error: (err as Error).message,
      });
      failCount++;
    }
  }

  // === Check 6: Outbox processing (autonomous — drives cron internally) ===
  if (webhookSucceeded) {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      results.push({
        name: "Outbox processing",
        ok: false,
        error:
          "CRON_SECRET not set in env (smoke drives the cron itself; set CRON_SECRET to enable Check 6).",
      });
      failCount++;
    } else {
      try {
        const cronUrl = `${args.baseUrl.replace(/\/$/, "")}/api/cron/domain-events-sync`;
        const cronResponse = await fetch(cronUrl, {
          method: "GET",
          headers: { Authorization: `Bearer ${cronSecret}` },
        });

        if (cronResponse.status !== 200) {
          const body = await cronResponse.text();
          results.push({
            name: "Outbox processing",
            ok: false,
            error: `cron returned status=${cronResponse.status} body=${body.slice(0, 200)}`,
          });
          failCount++;
        } else {
          const cronBody = (await cronResponse.json()) as {
            picked?: number;
            succeeded?: number;
            failed?: number;
            noHandler?: number;
            exhausted?: number;
          };

          const picked = cronBody.picked ?? 0;
          const succeeded = cronBody.succeeded ?? 0;
          const failed = cronBody.failed ?? 0;
          const detail = `picked=${picked} succeeded=${succeeded} failed=${failed} noHandler=${cronBody.noHandler ?? 0} exhausted=${cronBody.exhausted ?? 0}`;

          if (succeeded > 0 && failed === 0) {
            results.push({
              name: "Outbox processing",
              ok: true,
              detail,
            });
            passCount++;
          } else if (succeeded > 0 && failed > 0) {
            results.push({
              name: "Outbox processing",
              ok: false,
              error: `mixed: ${detail}. Some handlers failed — inspect domain_events.lastError`,
            });
            failCount++;
          } else {
            results.push({
              name: "Outbox processing",
              ok: false,
              error: `no events succeeded: ${detail}`,
            });
            failCount++;
          }
        }
      } catch (err) {
        results.push({
          name: "Outbox processing",
          ok: false,
          error: (err as Error).message,
        });
        failCount++;
      }
    }
  } else {
    results.push({
      name: "Outbox processing",
      ok: false,
      error: "Skipped (webhook delivery failed)",
    });
    failCount++;
  }

  // === Summary ===
  log("");
  log("=== SMOKE VALIDATION RESULTS ===");
  log("");
  results.forEach((r, i) => {
    const icon = r.ok ? "✓" : "✗";
    log(`${icon} Check ${i + 1}: ${r.name}`);
    if (r.detail) log(`   ${r.detail}`);
    if (r.error) log(`   ERROR: ${r.error}`);
  });
  log("");
  log(
    `Total: ${passCount} passed, ${failCount} failed (${results.length} checks)`,
  );

  await prisma.$disconnect();

  if (failCount > 0) {
    process.exit(1);
  } else {
    log("");
    log("✓✓✓ ALL CHECKS PASSED — Camada 1 smoke validated ✓✓✓");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[validate-camada-1-smoke] FATAL:", err);
  process.exit(1);
});
