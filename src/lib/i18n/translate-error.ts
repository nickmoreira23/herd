import type { Locale } from "./locales";
import { t, type MessageKey } from "./t";

/**
 * Translates a domain error to a user-facing message in the given locale.
 *
 * Looks up `error.{code}` in the dictionary using the error's `code` field.
 * If the error has no `code` (e.g., a raw Error), falls back to
 * `error.common.unknown`.
 *
 * Usage in RSC:
 *   try { ... } catch (err) {
 *     const message = translateError(err, locale);
 *     return <ErrorPanel message={message} />;
 *   }
 *
 * Usage in Client (with useT):
 *   const t = useT();
 *   try { ... } catch (err) {
 *     toast.error(translateErrorWithT(err, t));
 *   }
 *
 * The dictionary entries should accept interpolation params matching the
 * error's payload. Example:
 *   "error.ledger.account_not_found": "Account {accountCode} not found"
 *
 * Errors carrying complex state should expose interpolation-ready fields
 * directly (e.g., AccountNotFoundError.accountCode).
 */
export function translateError(err: unknown, locale: Locale): string {
  if (isErrorWithCode(err)) {
    const params = extractInterpolationParams(err);
    return t(`error.${err.code}` as MessageKey, locale, params);
  }
  // Unknown / unstructured error — fallback.
  return t("error.common.unknown" as MessageKey, locale);
}

type TranslateFunction = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

/**
 * Client-side variant of translateError. Receives the translator function
 * obtained from useT() instead of computing internally.
 *
 * Usage:
 *   const t = useT();
 *   ...
 *   toast.error(translateErrorWithT(err, t));
 */
export function translateErrorWithT(
  err: unknown,
  translator: TranslateFunction,
): string {
  if (isErrorWithCode(err)) {
    const params = extractInterpolationParams(err);
    return translator(`error.${err.code}` as MessageKey, params);
  }
  return translator("error.common.unknown" as MessageKey);
}

function isErrorWithCode(
  err: unknown,
): err is { code: string; message: string; [key: string]: unknown } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as Record<string, unknown>).code === "string"
  );
}

function extractInterpolationParams(
  err: { [key: string]: unknown },
): Record<string, string | number> {
  // Take all string/number fields from the error and pass them as params.
  // This way, an error like AccountNotFoundError exposes accountCode
  // automatically, and the dictionary entry can reference {accountCode}.
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(err)) {
    if (key === "code" || key === "message" || key === "name" || key === "stack") continue;
    if (typeof value === "string" || typeof value === "number") {
      params[key] = value;
    } else if (typeof value === "bigint") {
      params[key] = value.toString();
    }
  }
  return params;
}
