import { ChargeStatus } from "@prisma/client";

/**
 * Maps Recharge charge.status string to canonical ChargeStatus enum.
 *
 * Recharge values per docs (v2021-11):
 *   success, paid, queued, pending, error, declined, failed,
 *   refunded, partially_refunded, skipped, cancelled
 *
 * Throws on unknown values to ensure mapper coverage stays complete
 * (loud-fail over silent-skip — Sub-etapa 11 decision #6).
 */
export function mapChargeStatus(rechargeStatus: string): ChargeStatus {
  const normalized = rechargeStatus.toLowerCase();
  switch (normalized) {
    case "success":
    case "paid":
      return ChargeStatus.SUCCESS;
    case "queued":
      return ChargeStatus.QUEUED;
    case "pending":
      return ChargeStatus.PENDING;
    case "error":
    case "declined":
    case "failed":
      return ChargeStatus.FAILED;
    case "refunded":
      return ChargeStatus.REFUNDED;
    case "partially_refunded":
      return ChargeStatus.PARTIALLY_REFUNDED;
    case "skipped":
      return ChargeStatus.SKIPPED;
    case "cancelled":
      return ChargeStatus.CANCELLED;
    default:
      throw new Error(`Unknown Recharge charge status: "${rechargeStatus}"`);
  }
}
