import { toast } from "sonner";
import { translateErrorWithT } from "./translate-error";
import type { MessageKey } from "./messages/pt-BR";

type TranslateFunction = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

/**
 * Show a success toast using a translation key.
 *
 * Usage:
 *   const t = useT();
 *   notifySuccess("common.feedback.saved_successfully", t);
 *
 *   // With params:
 *   notifySuccess("knowledge.feedback.uploaded", t, { count: 3 });
 */
export function notifySuccess(
  key: MessageKey,
  t: TranslateFunction,
  params?: Record<string, string | number>,
): void {
  toast.success(t(key, params));
}

/**
 * Show an info toast using a translation key.
 */
export function notifyInfo(
  key: MessageKey,
  t: TranslateFunction,
  params?: Record<string, string | number>,
): void {
  toast.info(t(key, params));
}

/**
 * Show a warning toast using a translation key.
 */
export function notifyWarning(
  key: MessageKey,
  t: TranslateFunction,
  params?: Record<string, string | number>,
): void {
  toast.warning(t(key, params));
}

/**
 * Show an error toast. Two modes:
 *
 * 1. With an Error object that has a `code` field — uses translateErrorWithT
 *    to look up by error code:
 *       try { ... } catch (err) { notifyError(err, t); }
 *
 * 2. With a custom translation key — for application-specific messages
 *    that don't come from a thrown error:
 *       notifyError("error.knowledge.upload_failed", t);
 *
 * The discriminator: if first arg is a string, treat as key; otherwise treat
 * as Error.
 */
export function notifyError(
  errorOrKey: unknown,
  t: TranslateFunction,
  params?: Record<string, string | number>,
): void {
  if (typeof errorOrKey === "string") {
    toast.error(t(errorOrKey as MessageKey, params));
  } else {
    toast.error(translateErrorWithT(errorOrKey, t));
  }
}
