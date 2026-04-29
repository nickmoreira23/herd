export type DealStage =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export const STAGE_CONFIG: Record<
  DealStage,
  { label: string; color: string }
> = {
  LEAD: { label: "Lead", color: "bg-slate-200 text-slate-800" },
  QUALIFIED: { label: "Qualificado", color: "bg-blue-200 text-blue-800" },
  PROPOSAL: { label: "Proposta", color: "bg-amber-200 text-amber-800" },
  NEGOTIATION: { label: "Negociação", color: "bg-violet-200 text-violet-800" },
  WON: { label: "Ganho", color: "bg-emerald-200 text-emerald-800" },
  LOST: { label: "Perdido", color: "bg-rose-200 text-rose-800" },
};

export const STAGE_ORDER: DealStage[] = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

export interface LinkedContactSummary {
  id: string;
  firstName: string;
  lastName: string | null;
}

export interface LinkedCompanySummary {
  id: string;
  name: string;
}

export interface LinkedCampaignSummary {
  id: string;
  name: string;
}

export interface DealRow {
  id: string;
  title: string;
  description: string | null;
  stage: DealStage;
  amount: string | null; // serialized Decimal
  currency: string;
  probability: number | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  lostReason: string | null;
  contactId: string | null;
  companyId: string | null;
  campaignId: string | null;
  ownerId: string | null;
  source: string | null;
  contentJson: unknown;
  contentText: string;
  tags: string[];
  contact: LinkedContactSummary | null;
  company: LinkedCompanySummary | null;
  campaign: LinkedCampaignSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealDetail extends DealRow {
  contact:
    | (LinkedContactSummary & { email: string | null })
    | null;
}

export function formatAmount(amount: string | null, currency: string): string {
  if (!amount) return "—";
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function contactDisplayName(
  c: LinkedContactSummary | null | undefined
): string | null {
  if (!c) return null;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || null;
}
