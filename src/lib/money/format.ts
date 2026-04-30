import type { Money } from "./types";
import { getCurrencyMeta } from "./currency";

/**
 * Formata um valor monetário para apresentação ao usuário.
 * Usa Intl.NumberFormat baseado no locale da moeda.
 */
export function formatMoney(m: Money): string {
  const meta = getCurrencyMeta(m.currency);
  const formatter = new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency: meta.code,
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  const asNumber = Number(m.amountCents) / Math.pow(10, meta.decimals);
  return formatter.format(asNumber);
}

/**
 * Formata sem símbolo de moeda. Útil para tabelas onde a moeda já está em coluna separada.
 */
export function formatAmount(m: Money): string {
  const meta = getCurrencyMeta(m.currency);
  const asNumber = Number(m.amountCents) / Math.pow(10, meta.decimals);
  return new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(asNumber);
}
