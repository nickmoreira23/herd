import {
  type Money,
  type CurrencyCode,
  CurrencyMismatchError,
  InvalidMoneyError,
} from "./types";

export function money(amountCents: bigint | number, currency: CurrencyCode): Money {
  if (typeof amountCents === "number" && !Number.isFinite(amountCents)) {
    throw new InvalidMoneyError(`Non-finite amount: ${amountCents}`);
  }
  const cents = typeof amountCents === "number" ? BigInt(Math.trunc(amountCents)) : amountCents;
  return { amountCents: cents, currency };
}

export function zero(currency: CurrencyCode): Money {
  return { amountCents: 0n, currency };
}

function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new CurrencyMismatchError(a.currency, b.currency);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountCents: a.amountCents + b.amountCents, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amountCents: a.amountCents - b.amountCents, currency: a.currency };
}

export function negate(m: Money): Money {
  return { amountCents: -m.amountCents, currency: m.currency };
}

export function isZero(m: Money): boolean {
  return m.amountCents === 0n;
}

export function isPositive(m: Money): boolean {
  return m.amountCents > 0n;
}

export function isNegative(m: Money): boolean {
  return m.amountCents < 0n;
}

export function equals(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amountCents === b.amountCents;
}

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.amountCents < b.amountCents) return -1;
  if (a.amountCents > b.amountCents) return 1;
  return 0;
}

export function sum(values: ReadonlyArray<Money>): Money {
  if (values.length === 0) {
    throw new InvalidMoneyError("Cannot sum empty array — currency unknown.");
  }
  return values.reduce((acc, v) => add(acc, v));
}

/**
 * Multiplica um valor monetário por um fator inteiro.
 * Multiplicar por float é proibido aqui — use `applyBasisPoints` ou converta antes.
 */
export function multiplyByInteger(m: Money, factor: bigint | number): Money {
  if (typeof factor === "number" && !Number.isInteger(factor)) {
    throw new InvalidMoneyError(`Non-integer factor: ${factor}. Use applyBasisPoints for percentages.`);
  }
  const f = typeof factor === "number" ? BigInt(Math.trunc(factor)) : factor;
  return { amountCents: m.amountCents * f, currency: m.currency };
}

/**
 * Aplica uma taxa expressa em basis points (1bp = 0.01%, 10000bp = 100%).
 * Arredondamento half-away-from-zero (banker's rounding NÃO é usado por padrão financeiro brasileiro).
 */
export function applyBasisPoints(m: Money, basisPoints: bigint | number): Money {
  const bp = typeof basisPoints === "number" ? BigInt(Math.trunc(basisPoints)) : basisPoints;
  const numerator = m.amountCents * bp;
  const denominator = 10000n;
  // Half-away-from-zero rounding
  const halfAdjust = numerator >= 0n ? denominator / 2n : -(denominator / 2n);
  const result = (numerator + halfAdjust) / denominator;
  return { amountCents: result, currency: m.currency };
}

export type { Money, CurrencyCode };
export { CurrencyMismatchError, InvalidMoneyError };
