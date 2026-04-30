import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import type { SerializedMoney } from "@/lib/ledger";

type MoneyTone = "natural" | "positive" | "negative" | "muted";

interface MoneyProps {
  money: SerializedMoney;
  /**
   * - "natural" (default): green if positive, red if negative, muted if zero.
   * - "positive": always green tone.
   * - "negative": always red tone.
   * - "muted": always neutral tone (for header rows or when sign is irrelevant).
   */
  tone?: MoneyTone;
  className?: string;
}

export function Money({ money, tone = "natural", className }: MoneyProps) {
  const cents = BigInt(money.amountCents);
  const reconstructed = { amountCents: cents, currency: money.currency as "BRL" | "USD" };
  const formatted = formatMoney(reconstructed);

  let toneClass: string;
  if (tone === "positive") toneClass = "text-positive";
  else if (tone === "negative") toneClass = "text-negative";
  else if (tone === "muted") toneClass = "text-muted-foreground";
  else if (cents > 0n) toneClass = "text-positive";
  else if (cents < 0n) toneClass = "text-negative";
  else toneClass = "text-muted-foreground";

  return (
    <span className={cn("font-mono tabular-nums", toneClass, className)}>
      {formatted}
    </span>
  );
}
