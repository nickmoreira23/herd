import { ChargeStatus } from "@prisma/client";

/**
 * Maps Braintree Transaction.Status (13 values) to canonical ChargeStatus
 * enum (8 values).
 *
 * Braintree values per SDK v3.x:
 *   authorization_expired, authorized, authorizing, failed, gateway_rejected,
 *   processor_declined, settled, settlement_confirmed, settlement_declined,
 *   settlement_pending, settling, submitted_for_settlement, voided
 *
 * Mapping (cravada em Sub-etapa 15):
 *   settled / settlement_confirmed                        → SUCCESS
 *   settlement_declined / processor_declined /
 *     gateway_rejected / failed                           → FAILED
 *   voided / authorization_expired                        → CANCELLED
 *   submitted_for_settlement / settling /
 *     settlement_pending / authorizing / authorized       → PENDING
 *
 * Throws on unknown values (loud-fail over silent-skip — Sub-etapa 11
 * decision #6).
 */
export function mapBraintreeChargeStatus(braintreeStatus: string): ChargeStatus {
  const normalized = braintreeStatus.toLowerCase();
  switch (normalized) {
    case "settled":
    case "settlement_confirmed":
      return ChargeStatus.SUCCESS;
    case "settlement_declined":
    case "processor_declined":
    case "gateway_rejected":
    case "failed":
      return ChargeStatus.FAILED;
    case "voided":
    case "authorization_expired":
      return ChargeStatus.CANCELLED;
    case "submitted_for_settlement":
    case "settling":
    case "settlement_pending":
    case "authorizing":
    case "authorized":
      return ChargeStatus.PENDING;
    default:
      throw new Error(`Unknown Braintree transaction status: "${braintreeStatus}"`);
  }
}
