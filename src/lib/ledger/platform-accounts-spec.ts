import type { AccountType, AccountOwnerKind } from "@prisma/client";

/**
 * Declarative spec of all platform-level accounts in the ledger.
 *
 * This is the single source of truth for accounts that are intrinsic to
 * the platform (not tied to a specific profile, partner, or external party).
 * Per-profile accounts (`profile:{uuid}:...`) are created on-demand by other
 * services, not via this seed.
 *
 * Adding an account here:
 *   1. Add the entry below.
 *   2. Re-run `npm run db:seed:ledger`.
 *   3. The new account is upserted; existing accounts are left untouched.
 *
 * Renaming an account: change the `name`. Re-run seed updates the existing
 * row. The `code` is the immutable identity — never change it.
 *
 * Changing `accountType` or `currency` of an existing code is FORBIDDEN
 * (the seed will throw). If a structural change is needed, create a new
 * code, post compensating entries to the old, archive the old.
 */

export interface PlatformAccountSpec {
  code: string;
  name: string;
  accountType: AccountType;
  ownerKind: AccountOwnerKind;
  metadata?: Record<string, unknown>;
}

const SUPPORTED_SEED_CURRENCIES = ["BRL", "USD"] as const;

interface AccountTemplate {
  semanticRole: string;
  name: string;
  accountType: AccountType;
}

const PLATFORM_ACCOUNT_TEMPLATES: AccountTemplate[] = [
  {
    semanticRole: "cash",
    name: "Platform cash",
    accountType: "ASSET",
  },
  {
    semanticRole: "receivable",
    name: "Platform receivable (gateway settlement pending)",
    accountType: "ASSET",
  },
  {
    semanticRole: "partner_payable",
    name: "Partner payables (aggregate)",
    accountType: "LIABILITY",
  },
  {
    semanticRole: "merchant_payable",
    name: "Merchant payables (aggregate)",
    accountType: "LIABILITY",
  },
  {
    semanticRole: "tax_payable",
    name: "Tax payable",
    accountType: "LIABILITY",
  },
  {
    semanticRole: "holdback_reserve",
    name: "Holdback reserve (commissions in waiting period)",
    accountType: "LIABILITY",
  },
  {
    semanticRole: "revenue",
    name: "Platform revenue",
    accountType: "REVENUE",
  },
  {
    semanticRole: "acquisition_expense",
    name: "Acquisition expense (pre-sale partner commissions)",
    accountType: "EXPENSE",
  },
  {
    semanticRole: "tier_bonus_expense",
    name: "Tier bonus expense (paid by market/multimarket plan operators)",
    accountType: "EXPENSE",
  },
  {
    semanticRole: "opening_equity",
    name: "Opening balance equity (technical)",
    accountType: "EQUITY",
  },
];

/**
 * The fully-expanded list of platform accounts to seed. Each template
 * is materialized once per supported currency.
 */
export const PLATFORM_ACCOUNTS: PlatformAccountSpec[] = SUPPORTED_SEED_CURRENCIES.flatMap(
  (currency) =>
    PLATFORM_ACCOUNT_TEMPLATES.map(
      (tpl): PlatformAccountSpec => ({
        code: `platform:${tpl.semanticRole}:${currency.toLowerCase()}`,
        name: `${tpl.name} (${currency})`,
        accountType: tpl.accountType,
        ownerKind: "PLATFORM",
      }),
    ),
);

/**
 * Re-export so callers can iterate templates without re-parsing codes.
 */
export { PLATFORM_ACCOUNT_TEMPLATES, SUPPORTED_SEED_CURRENCIES };
