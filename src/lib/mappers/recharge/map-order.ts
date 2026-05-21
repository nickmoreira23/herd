import type { Prisma, PrismaClient } from "@prisma/client";
import type { RechargeOrderPayload } from "./types";

/**
 * Recharge "order" is the post-checkout transaction. Often references a
 * `charge_id` and contains the same line items as the charge.
 *
 * V1 treatment: no dedicated canonical `Order` table (Sub-etapa 9 schema).
 * Order events are captured in `BillingEvent` audit log by the handler;
 * this mapper is a noop placeholder for explicit dispatch shape.
 *
 * When product needs order-level analytics (cart total before charge, line
 * items not yet billed), introduce an `Order` canonical model and revisit.
 */
interface MapOrderContext {
  tenantId: string;
  providerId: string;
  customerId: string;
}

export async function mapRechargeOrder(
  _client: PrismaClient | Prisma.TransactionClient,
  _payload: RechargeOrderPayload,
  _ctx: MapOrderContext,
): Promise<void> {
  // V1: no canonical row written. BillingEvent audit handled by handler.
}
