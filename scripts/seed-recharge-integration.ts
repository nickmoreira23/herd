import "dotenv/config";

/**
 * Seeds the Recharge Integration row with the API key from env.
 *
 * Idempotent: creates if absent; updates `authType + credentials + status`
 * if present. Safe to run multiple times.
 *
 * Sub-etapa 10 (Camada 1 retomada): API key path, dashboard-managed
 * webhooks. Multi-tenant migration tracked as tech debt in AGENTS.md.
 *
 * Usage: `npm run seed:recharge`
 */
import { IntegrationCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

async function main(): Promise<void> {
  const apiToken = process.env.RECHARGE_API_KEY;
  if (!apiToken) {
    throw new Error(
      "RECHARGE_API_KEY not set in environment. Add it to .env (and to the deploy env) before running.",
    );
  }

  const credentials = encrypt(JSON.stringify({ apiToken }));

  const existing = await prisma.integration.findUnique({
    where: { slug: "recharge" },
  });

  if (existing) {
    const updated = await prisma.integration.update({
      where: { slug: "recharge" },
      data: {
        authType: "api_key",
        credentials,
        status: "AVAILABLE",
      },
    });
    console.log(
      `[seed:recharge] Updated Integration row id=${updated.id} (authType=api_key, status=AVAILABLE).`,
    );
  } else {
    const created = await prisma.integration.create({
      data: {
        slug: "recharge",
        name: "Recharge",
        category: IntegrationCategory.BILLING,
        status: "AVAILABLE",
        authType: "api_key",
        credentials,
      },
    });
    console.log(
      `[seed:recharge] Created Integration row id=${created.id} (authType=api_key, status=AVAILABLE).`,
    );
  }
}

main()
  .catch((err) => {
    console.error("[seed:recharge] FAILED:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
