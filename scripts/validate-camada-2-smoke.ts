#!/usr/bin/env tsx
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

/**
 * Sub-etapa 17.0.3 — Camada 2 smoke validator (one-shot, idempotent).
 *
 * Runs 6 checks end-to-end against a target deploy (default localhost):
 *   1. Env vars present (BRAINTREE_*, ENCRYPTION_KEY, DATABASE_URL).
 *   2. Integration row Braintree exists + credentials decrypt.
 *   3. MemberConnection Braintree present (≥1 row).
 *   4. BraintreeService.testConnection (clientToken.generate ping).
 *   5. Webhook delivery (POST sample notification → 200).
 *   6. Outbox processing (wait 75s for cron, verify lastProcessedAt fresh).
 *
 * Usage:
 *   npm run smoke:camada-2
 *   npm run smoke:camada-2 -- --base-url=https://herd-production.up.railway.app
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
  const log = (msg: string) => console.log(`[validate-camada-2-smoke] ${msg}`);

  log(`Starting smoke validation against ${args.baseUrl}`);
  log("");

  const prisma = makeAdminClient();

  // === Check 1: env vars present ===
  {
    const required = [
      "BRAINTREE_MERCHANT_ID",
      "BRAINTREE_PUBLIC_KEY",
      "BRAINTREE_PRIVATE_KEY",
      "BRAINTREE_ENVIRONMENT",
      "ENCRYPTION_KEY",
      "DATABASE_URL",
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

  // === Check 2: Integration row Braintree + credentials decrypt ===
  let integrationId: string | null = null;
  {
    try {
      const integration = await prisma.integration.findUnique({
        where: { slug: "braintree" },
        select: { id: true, status: true, authType: true, credentials: true },
      });

      if (!integration) {
        results.push({
          name: "Integration row Braintree",
          ok: false,
          error: "Not found. Run: npm run seed:braintree",
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
            if (parsed.merchantId && parsed.publicKey && parsed.privateKey) {
              results.push({
                name: "Integration credentials decrypt",
                ok: true,
                detail: `4 fields OK, env=${parsed.environment}`,
              });
              passCount++;
            } else {
              results.push({
                name: "Integration credentials decrypt",
                ok: false,
                error: "Missing fields in decrypted blob",
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
        name: "Integration row Braintree",
        ok: false,
        error: (err as Error).message,
      });
      failCount++;
    }
  }

  // === Check 3: MemberConnection Braintree ===
  if (integrationId) {
    const connections = await prisma.memberConnection.findMany({
      where: { integrationId },
      select: { id: true, externalUserId: true, tenantId: true },
    });

    if (connections.length === 0) {
      results.push({
        name: "MemberConnection Braintree",
        ok: false,
        error:
          "No connections. Run: npm run seed:braintree-connection -- --tenant=<orgId> --profile=<profileId>",
      });
      failCount++;
    } else if (connections.length === 1) {
      results.push({
        name: "MemberConnection Braintree",
        ok: true,
        detail: `1 connection (V1 fallback compatible), id=${connections[0]!.id.slice(0, 8)}...`,
      });
      passCount++;
    } else {
      results.push({
        name: "MemberConnection Braintree",
        ok: true,
        detail: `${connections.length} connections (multi-tenant)`,
      });
      passCount++;
    }
  } else {
    results.push({
      name: "MemberConnection Braintree",
      ok: false,
      error: "Skipped (Integration row missing)",
    });
    failCount++;
  }

  // === Check 4: BraintreeService.testConnection ===
  {
    try {
      const { BraintreeService } = await import("@/lib/services/braintree");
      const svc = await BraintreeService.fromIntegration();
      const result = await svc.testConnection();
      if (result.ok) {
        results.push({
          name: "BraintreeService.testConnection",
          ok: true,
          detail: `environment=${result.environment}`,
        });
        passCount++;
      } else {
        results.push({
          name: "BraintreeService.testConnection",
          ok: false,
          error: "ok=false",
        });
        failCount++;
      }
    } catch (err) {
      results.push({
        name: "BraintreeService.testConnection",
        ok: false,
        error: (err as Error).message,
      });
      failCount++;
    }
  }

  // === Check 5: Webhook delivery ===
  let webhookSucceeded = false;
  {
    try {
      const { BraintreeService } = await import("@/lib/services/braintree");
      const svc = await BraintreeService.fromIntegration();
      const wt = (
        svc.gateway as unknown as {
          webhookTesting: {
            sampleNotification: (
              k: string,
              id: string,
            ) => { bt_signature: string; bt_payload: string };
          };
        }
      ).webhookTesting;
      const sample = wt.sampleNotification(
        "transaction_settled",
        `validate_smoke_${Date.now()}`,
      );

      const body = new URLSearchParams({
        bt_signature: sample.bt_signature,
        bt_payload: sample.bt_payload,
      }).toString();

      const targetUrl = `${args.baseUrl.replace(/\/$/, "")}/api/webhooks/braintree`;
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
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

  // === Check 6: Outbox processing ===
  if (webhookSucceeded) {
    log("");
    log("Waiting 75s for cron to process outbox (cron runs every 1min)...");
    await new Promise((r) => setTimeout(r, 75_000));

    try {
      const healthResponse = await fetch(`${args.baseUrl.replace(/\/$/, "")}/api/health`);
      const healthBody = (await healthResponse.json()) as {
        outbox?: { lastProcessedAt?: string | null };
      };
      const lastProcessed = healthBody.outbox?.lastProcessedAt;

      if (lastProcessed) {
        const lastProcessedDate = new Date(lastProcessed);
        const secondsAgo =
          (Date.now() - lastProcessedDate.getTime()) / 1000;

        if (secondsAgo < 120) {
          results.push({
            name: "Outbox processing",
            ok: true,
            detail: `lastProcessedAt ${Math.round(secondsAgo)}s ago`,
          });
          passCount++;
        } else {
          results.push({
            name: "Outbox processing",
            ok: false,
            error: `lastProcessedAt is stale: ${Math.round(secondsAgo)}s ago. Cron may not be running.`,
          });
          failCount++;
        }
      } else {
        results.push({
          name: "Outbox processing",
          ok: false,
          error: "lastProcessedAt is null",
        });
        failCount++;
      }
    } catch (err) {
      results.push({
        name: "Outbox processing",
        ok: false,
        error: (err as Error).message,
      });
      failCount++;
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
    log("✓✓✓ ALL CHECKS PASSED — Camada 2 smoke validated ✓✓✓");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[validate-camada-2-smoke] FATAL:", err);
  process.exit(1);
});
