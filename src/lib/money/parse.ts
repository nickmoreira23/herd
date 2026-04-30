import { type Money, type CurrencyCode, InvalidMoneyError } from "./types";
import { getCurrencyMeta } from "./currency";

/**
 * Faz parse de uma string vinda de input do usuário em uma Money.
 * Aceita formatos como "1.234,56", "1234.56", "R$ 1.234,56".
 * Currency é parâmetro obrigatório — não inferimos a partir do símbolo.
 */
export function parseMoneyInput(input: string, currency: CurrencyCode): Money {
  const meta = getCurrencyMeta(currency);
  const cleaned = input
    .replace(/[^\d,.\-]/g, "")
    .trim();

  if (!cleaned) {
    throw new InvalidMoneyError(`Cannot parse empty input as money.`);
  }

  let normalized: string;
  if (currency === "BRL") {
    // pt-BR: "1.234,56" -> "1234.56"
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // en-US: "1,234.56" -> "1234.56"
    normalized = cleaned.replace(/,/g, "");
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    throw new InvalidMoneyError(`Cannot parse "${input}" as a finite number.`);
  }

  const cents = BigInt(Math.round(num * Math.pow(10, meta.decimals)));
  return { amountCents: cents, currency };
}

/**
 * Converte um Decimal do Prisma (ou string equivalente) em Money.
 * Bridge para interoperar com o legado Decimal(10,2).
 */
export function moneyFromDecimal(decimal: { toString(): string }, currency: CurrencyCode): Money {
  const meta = getCurrencyMeta(currency);
  const str = decimal.toString();
  const num = Number(str);
  if (!Number.isFinite(num)) {
    throw new InvalidMoneyError(`Cannot convert decimal "${str}" to money.`);
  }
  const cents = BigInt(Math.round(num * Math.pow(10, meta.decimals)));
  return { amountCents: cents, currency };
}

/**
 * Converte Money de volta para Decimal-equivalente (string com ponto decimal).
 * Útil para gravar em colunas Decimal(10,2) do legado.
 */
export function moneyToDecimalString(m: Money): string {
  const meta = getCurrencyMeta(m.currency);
  const divisor = BigInt(Math.pow(10, meta.decimals));
  const integer = m.amountCents / divisor;
  const fractional = m.amountCents < 0n ? -(m.amountCents % divisor) : m.amountCents % divisor;
  const fractionalStr = fractional.toString().padStart(meta.decimals, "0");
  const sign = m.amountCents < 0n && integer === 0n ? "-" : "";
  return `${sign}${integer.toString()}.${fractionalStr}`;
}
