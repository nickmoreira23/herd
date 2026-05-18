/**
 * Public surface of the webhook framework (Sub-etapa 5).
 *
 * Handlers import only from this file. The interface, verifiers, and tenant
 * resolver are barrel-exported below; internal helpers stay private.
 */

export type {
  VerificationResult,
  WebhookVerifier,
} from "./verifier.interface";

export { GorgiasWebhookVerifier } from "./verifiers/gorgias.verifier";
export { IntercomWebhookVerifier } from "./verifiers/intercom.verifier";
export { RechargeWebhookVerifier } from "./verifiers/recharge.verifier";
export { RecallWebhookVerifier } from "./verifiers/recall.verifier";

export {
  resolveTenantFromPayload,
  type TenantResolution,
} from "./tenant-resolver";
