import { connection } from "next/server";
import { EarningsClient } from "@/components/earnings/earnings-client";

interface EarningEvent {
  date: string;
  type: "Sale" | "Residual" | "Bonus" | "Clawback";
  customer: string;
  plan: string;
  amount: number;
  status: "earned" | "pending" | "released" | "clawed-back";
}

function buildMockEarnings(): { events: EarningEvent[]; daily: { date: string; amount: number }[] } {
  // Generate the last 30 days of mock daily totals + a list of recent events.
  const today = new Date();
  const daily: { date: string; amount: number }[] = [];
  const events: EarningEvent[] = [];

  const customers = [
    "Aisha Patel",
    "Marcus Lee",
    "Sofia Rivera",
    "Jordan Kim",
    "Emma Walsh",
    "Liam O'Connor",
    "Yuki Tanaka",
    "Diego Alvarez",
    "Nina Petrova",
    "Caleb Brooks",
    "Tomás Silva",
    "Hana Sato",
  ];
  const plans = ["Starter", "Performance", "Elite", "Legend"];

  // Deterministic pseudo-random for a stable preview
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);

    // Daily total: 0–6 events worth $25–$300
    const eventCount = Math.floor(rand() * 4);
    let dayTotal = 0;
    for (let e = 0; e < eventCount; e++) {
      const isResidual = rand() > 0.6;
      const isBonus = !isResidual && rand() > 0.85;
      const isClawback = !isResidual && !isBonus && rand() > 0.95;
      const type: EarningEvent["type"] = isResidual
        ? "Residual"
        : isBonus
          ? "Bonus"
          : isClawback
            ? "Clawback"
            : "Sale";
      const amountBase =
        type === "Sale" ? 50 + Math.floor(rand() * 200) :
        type === "Residual" ? 6 + Math.floor(rand() * 30) :
        type === "Bonus" ? 75 :
        -(50 + Math.floor(rand() * 100));
      events.push({
        date: iso,
        type,
        customer: customers[Math.floor(rand() * customers.length)] ?? "Customer",
        plan: plans[Math.floor(rand() * plans.length)] ?? "Starter",
        amount: amountBase,
        status:
          type === "Clawback"
            ? "clawed-back"
            : i < 3
              ? "pending"
              : i < 14
                ? "earned"
                : "released",
      });
      dayTotal += amountBase;
    }
    daily.push({ date: iso, amount: dayTotal });
  }

  // Sort events: most recent first
  events.sort((a, b) => b.date.localeCompare(a.date));

  return { events, daily };
}

export default async function EarningsPage() {
  await connection();
  const { events, daily } = buildMockEarnings();

  const totals = {
    last30: daily.reduce((s, d) => s + d.amount, 0),
    pending: events.filter((e) => e.status === "pending").reduce((s, e) => s + e.amount, 0),
    released: events.filter((e) => e.status === "released").reduce((s, e) => s + e.amount, 0),
    clawback: events.filter((e) => e.status === "clawed-back").reduce((s, e) => s + e.amount, 0),
    eventCount: events.length,
  };

  return <EarningsClient daily={daily} events={events} totals={totals} />;
}
