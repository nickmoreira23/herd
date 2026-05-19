/**
 * Sub-etapa 9 — Billing module type aliases.
 *
 * Re-exports the 11 generated Prisma types (and the `ChargeStatus` enum)
 * under shorter, ergonomic names. Consumers should import from here, not
 * from `@prisma/client` directly, so that future renames or shape
 * changes can be absorbed at a single boundary.
 *
 * Integration with the Ledger primitives (`JournalEntry.sourceKind='charge'`)
 * is Camada 3 and is intentionally not modeled here.
 */

export type {
  PaymentProvider,
  BillingCustomer,
  PaymentMethod,
  Subscription,
  Charge,
  ChargeLineItem,
  Invoice,
  Refund,
  DunningAttempt,
  PortalSession,
  BillingEvent,
} from "@prisma/client";

export { ChargeStatus } from "@prisma/client";
