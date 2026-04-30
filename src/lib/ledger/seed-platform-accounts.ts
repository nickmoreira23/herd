import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { LedgerError } from "./errors";
import { PLATFORM_ACCOUNTS } from "./platform-accounts-spec";

/**
 * Result of a seed run. Useful for tests, observability, and CLI output.
 */
export interface SeedPlatformAccountsResult {
  created: string[];      // codes that didn't exist and were inserted
  updated: string[];      // codes that existed and had name/metadata refreshed
  unchanged: string[];    // codes that existed and matched the spec exactly
  total: number;
}

class StructuralAccountMismatchError extends LedgerError {
  constructor(
    public code: string,
    public field: "accountType" | "currency",
    public seedValue: string,
    public dbValue: string,
  ) {
    super(
      `Refusing to update account "${code}" — ${field} differs ` +
      `(spec wants "${seedValue}", DB has "${dbValue}"). ` +
      `Structural changes (accountType, currency) are not allowed via seed; ` +
      `create a new code instead and migrate balances by posting compensating entries.`,
    );
    this.name = "StructuralAccountMismatchError";
  }
}

/**
 * Seeds the platform-level accounts as declared in `PLATFORM_ACCOUNTS`.
 *
 * Idempotent: re-running is always safe.
 * - Accounts that don't exist are inserted.
 * - Accounts that exist with matching name/metadata are left untouched.
 * - Accounts that exist with stale name or metadata get those fields refreshed.
 * - Accounts that exist with a DIFFERENT accountType or currency throw
 *   `StructuralAccountMismatchError`. The seed never silently mutates the
 *   structural identity of an account.
 * - `archivedAt` is never touched — archival is operational, not declarative.
 *
 * Returns a result object describing what changed.
 */
export async function seedPlatformAccounts(
  client: PrismaClient | Prisma.TransactionClient = prisma,
): Promise<SeedPlatformAccountsResult> {
  const result: SeedPlatformAccountsResult = {
    created: [],
    updated: [],
    unchanged: [],
    total: PLATFORM_ACCOUNTS.length,
  };

  for (const spec of PLATFORM_ACCOUNTS) {
    const existing = await client.account.findUnique({
      where: { code: spec.code },
    });

    if (!existing) {
      const currency = parseCurrencyFromCode(spec.code);
      await client.account.create({
        data: {
          code: spec.code,
          name: spec.name,
          accountType: spec.accountType,
          ownerKind: spec.ownerKind,
          currency,
          metadata: (spec.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
      result.created.push(spec.code);
      continue;
    }

    // Validate structural identity is unchanged.
    const expectedCurrency = parseCurrencyFromCode(spec.code);
    if (existing.accountType !== spec.accountType) {
      throw new StructuralAccountMismatchError(
        spec.code,
        "accountType",
        spec.accountType,
        existing.accountType,
      );
    }
    if (existing.currency !== expectedCurrency) {
      throw new StructuralAccountMismatchError(
        spec.code,
        "currency",
        expectedCurrency,
        existing.currency,
      );
    }

    // Compare mutable fields.
    const existingMetadataJson = JSON.stringify(existing.metadata ?? {});
    const specMetadataJson = JSON.stringify(spec.metadata ?? {});
    const nameDiffers = existing.name !== spec.name;
    const metadataDiffers = existingMetadataJson !== specMetadataJson;

    if (!nameDiffers && !metadataDiffers) {
      result.unchanged.push(spec.code);
      continue;
    }

    await client.account.update({
      where: { code: spec.code },
      data: {
        name: spec.name,
        metadata: (spec.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    result.updated.push(spec.code);
  }

  return result;
}

/**
 * Extracts the currency suffix from a code like "platform:revenue:brl".
 * The currency is always the last `:` segment, uppercased.
 */
function parseCurrencyFromCode(code: string): string {
  const parts = code.split(":");
  const last = parts[parts.length - 1];
  return last.toUpperCase();
}
