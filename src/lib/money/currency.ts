import type { CurrencyCode } from "./types";

interface CurrencyMeta {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
  locale: string;
}

const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  BRL: { code: "BRL", symbol: "R$", decimals: 2, locale: "pt-BR" },
  USD: { code: "USD", symbol: "$", decimals: 2, locale: "en-US" },
};

export function getCurrencyMeta(code: CurrencyCode): CurrencyMeta {
  return CURRENCIES[code];
}

export const SUPPORTED_CURRENCIES: ReadonlyArray<CurrencyCode> = Object.keys(
  CURRENCIES,
) as CurrencyCode[];

export const DEFAULT_CURRENCY: CurrencyCode = "BRL";
