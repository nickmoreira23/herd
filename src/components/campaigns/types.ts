export type CampaignStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "ARCHIVED";

export type CampaignChannel =
  | "EMAIL"
  | "SOCIAL"
  | "ADS"
  | "EVENT"
  | "CONTENT"
  | "WEBINAR"
  | "REFERRAL"
  | "DIRECT_MAIL"
  | "SMS"
  | "PARTNER"
  | "OTHER";

export type CampaignObjective =
  | "AWARENESS"
  | "ACQUISITION"
  | "ACTIVATION"
  | "RETENTION"
  | "REVENUE"
  | "REFERRAL"
  | "OTHER";

export const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: "Rascunho", color: "bg-slate-200 text-slate-800" },
  SCHEDULED: { label: "Agendada", color: "bg-blue-200 text-blue-800" },
  ACTIVE: { label: "Ativa", color: "bg-emerald-200 text-emerald-800" },
  PAUSED: { label: "Pausada", color: "bg-amber-200 text-amber-800" },
  COMPLETED: { label: "Concluída", color: "bg-violet-200 text-violet-800" },
  ARCHIVED: { label: "Arquivada", color: "bg-zinc-200 text-zinc-700" },
};

export const STATUS_ORDER: CampaignStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
];

export const CHANNEL_CONFIG: Record<CampaignChannel, { label: string; emoji: string }> = {
  EMAIL: { label: "Email", emoji: "✉️" },
  SOCIAL: { label: "Social", emoji: "📱" },
  ADS: { label: "Ads", emoji: "💰" },
  EVENT: { label: "Evento", emoji: "🎪" },
  CONTENT: { label: "Conteúdo", emoji: "📝" },
  WEBINAR: { label: "Webinar", emoji: "🎙️" },
  REFERRAL: { label: "Indicação", emoji: "🤝" },
  DIRECT_MAIL: { label: "Mala direta", emoji: "📬" },
  SMS: { label: "SMS", emoji: "💬" },
  PARTNER: { label: "Parceiro", emoji: "🔗" },
  OTHER: { label: "Outro", emoji: "📌" },
};

export const CHANNEL_ORDER: CampaignChannel[] = [
  "EMAIL",
  "SOCIAL",
  "ADS",
  "EVENT",
  "CONTENT",
  "WEBINAR",
  "REFERRAL",
  "DIRECT_MAIL",
  "SMS",
  "PARTNER",
  "OTHER",
];

export const OBJECTIVE_CONFIG: Record<CampaignObjective, string> = {
  AWARENESS: "Awareness",
  ACQUISITION: "Aquisição",
  ACTIVATION: "Ativação",
  RETENTION: "Retenção",
  REVENUE: "Receita",
  REFERRAL: "Indicação",
  OTHER: "Outro",
};

export const OBJECTIVE_ORDER: CampaignObjective[] = [
  "AWARENESS",
  "ACQUISITION",
  "ACTIVATION",
  "RETENTION",
  "REVENUE",
  "REFERRAL",
  "OTHER",
];

export interface AttributedDealSummary {
  id: string;
  title: string;
  stage: string;
  amount: string | null;
  currency: string;
}

export interface CampaignRow {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  channels: CampaignChannel[];
  objective: CampaignObjective | null;
  startDate: string | null;
  endDate: string | null;
  budget: string | null;
  spent: string | null;
  currency: string;
  audience: string | null;
  ownerId: string | null;
  metrics: unknown;
  contentJson: unknown;
  contentText: string;
  tags: string[];
  dealCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDetail extends CampaignRow {
  deals?: AttributedDealSummary[];
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

export function budgetProgress(spent: string | null, budget: string | null): {
  pct: number;
  over: boolean;
} | null {
  if (!budget) return null;
  const b = Number(budget);
  if (!b || Number.isNaN(b)) return null;
  const s = spent ? Number(spent) : 0;
  const pct = Math.min(100, (s / b) * 100);
  return { pct, over: s > b };
}
