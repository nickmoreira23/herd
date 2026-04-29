export type ExperienceFormat = "IN_PERSON" | "ONLINE" | "HYBRID" | "SELF_PACED";

export type ExperienceStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "OPEN"
  | "SOLD_OUT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const STATUS_ORDER: ExperienceStatus[] = [
  "DRAFT",
  "SCHEDULED",
  "OPEN",
  "SOLD_OUT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export const FORMAT_ORDER: ExperienceFormat[] = [
  "IN_PERSON",
  "ONLINE",
  "HYBRID",
  "SELF_PACED",
];

export const STATUS_COLOR: Record<ExperienceStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-800",
  SCHEDULED: "bg-blue-200 text-blue-800",
  OPEN: "bg-emerald-200 text-emerald-800",
  SOLD_OUT: "bg-amber-200 text-amber-800",
  IN_PROGRESS: "bg-violet-200 text-violet-800",
  COMPLETED: "bg-zinc-200 text-zinc-700",
  CANCELLED: "bg-rose-200 text-rose-800",
};

export interface ExperienceRow {
  id: string;
  name: string;
  headline: string | null;
  description: string | null;
  format: ExperienceFormat;
  status: ExperienceStatus;
  startDate: string | null;
  endDate: string | null;
  durationMin: number | null;
  locationName: string | null;
  locationUrl: string | null;
  capacity: number | null;
  price: string | null;
  currency: string;
  coverImageUrl: string | null;
  hostId: string | null;
  contentJson: unknown;
  contentText: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function formatPrice(price: string | null, currency: string): string {
  if (!price) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
