/**
 * Money é representado como uma tupla (amount_cents, currency).
 * - amount_cents: BIGINT em centavos (ou menor unidade indivisível da moeda).
 * - currency: código ISO 4217 de 3 letras em UPPERCASE.
 *
 * Operações aritméticas e comparações entre moedas diferentes lançam erro.
 * Não use float para dinheiro em nenhum lugar.
 */
export type CurrencyCode = "BRL" | "USD";

export interface Money {
  readonly amountCents: bigint;
  readonly currency: CurrencyCode;
}

export class CurrencyMismatchError extends Error {
  constructor(left: CurrencyCode, right: CurrencyCode) {
    super(
      `Currency mismatch: cannot operate on ${left} and ${right} without explicit conversion.`,
    );
    this.name = "CurrencyMismatchError";
  }
}

export class InvalidMoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidMoneyError";
  }
}
