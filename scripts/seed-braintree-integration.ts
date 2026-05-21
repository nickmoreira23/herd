import "dotenv/config";

import { IntegrationCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";

/**
 * Sub-etapa 13 — seeds the Braintree Integration row from env vars.
 *
 * Idempotent: creates if absent; updates `authType + credentials + status`
 * if present. Mirrors `seed-recharge-integration.ts` shape (Sub-etapa 10).
 *
 * Required env vars (all 4):
 *   - BRAINTREE_MERCHANT_ID
 *   - BRAINTREE_PUBLIC_KEY
 *   - BRAINTREE_PRIVATE_KEY
 *   - BRAINTREE_ENVIRONMENT  ("sandbox" | "production")
 *
 * Camada 2 V1: sandbox only. Production cutover is tech debt rastreado
 * in AGENTS.md "Camada 2" section.
 *
 * Usage: `npm run seed:braintree`
 */

async function main(): Promise<void> {
  const merchantId = process.env.BRAINTREE_MERCHANT_ID;
  const publicKey = process.env.BRAINTREE_PUBLIC_KEY;
  const privateKey = process.env.BRAINTREE_PRIVATE_KEY;
  const environment = process.env.BRAINTREE_ENVIRONMENT;

  if (!merchantId || !publicKey || !privateKey || !environment) {
    throw new Error(
      "Missing Braintree env vars. Required: BRAINTREE_MERCHANT_ID, " +
        "BRAINTREE_PUBLIC_KEY, BRAINTREE_PRIVATE_KEY, BRAINTREE_ENVIRONMENT.",
    );
  }
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error(
      `BRAINTREE_ENVIRONMENT must be 'sandbox' or 'production'. Got: ${environment}`,
    );
  }

  const credentials = encrypt(
    JSON.stringify({ merchantId, publicKey, privateKey, environment }),
  );

  const existing = await prisma.integration.findUnique({
    where: { slug: "braintree" },
  });

  if (existing) {
    const updated = await prisma.integration.update({
      where: { slug: "braintree" },
      data: {
        authType: "api_key",
        credentials,
        status: "AVAILABLE",
      },
    });
    console.log(
      `[seed:braintree] Updated Integration row id=${updated.id} (environment=${environment}).`,
    );
  } else {
    const created = await prisma.integration.create({
      data: {
        slug: "braintree",
        name: "Braintree",
        category: IntegrationCategory.BILLING,
        status: "AVAILABLE",
        authType: "api_key",
        credentials,
      },
    });
    console.log(
      `[seed:braintree] Created Integration row id=${created.id} (environment=${environment}).`,
    );
  }
}

main()
  .catch((err) => {
    console.error("[seed:braintree] FAILED:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
