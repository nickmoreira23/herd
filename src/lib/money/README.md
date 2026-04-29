# Money helpers

The `Money` type is the canonical representation for all monetary values
in the new ledger and any system built on top of it (transactions, commission
entries, payouts, partner plans).

## Why `(amountCents: bigint, currency: CurrencyCode)`?

- **Precision**: `bigint` arithmetic is exact. Float arithmetic isn't.
- **No silent currency mixups**: every operation that crosses currencies
  throws `CurrencyMismatchError` at runtime instead of producing nonsense.
- **Compatibility**: bridges (`moneyFromDecimal`, `moneyToDecimalString`)
  let us interop with the legacy `Decimal(10,2)` columns without conversion
  bugs.

## Rules

- **Never** use `number` for money in code that touches the new ledger.
- **Never** sum, subtract, or compare two `Money` of different currencies.
  Convert explicitly if you must.
- **Never** multiply `Money` by a non-integer `number`. Use `applyBasisPoints`
  for percentages.
- **Always** parse user input via `parseMoneyInput`. Do not parse `parseFloat`
  on a localized string.
- **Always** format for display via `formatMoney` or `formatAmount`. Do not
  build strings by hand.

## Round-trip with the legacy Decimal world

```ts
// Reading from Prisma:
const productPrice = moneyFromDecimal(product.retailPrice, "BRL");

// Writing back to Prisma:
await prisma.product.update({
  where: { id },
  data: { retailPrice: moneyToDecimalString(newPrice) },
});
```

## Adding a new currency

1. Add the code to the `CurrencyCode` union in `types.ts`.
2. Add the metadata entry in `currency.ts`.
3. Add tests in `money.test.ts` covering format/parse for the new currency.
