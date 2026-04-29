export type ServicePricingType =
  | "FIXED"
  | "HOURLY"
  | "DAILY"
  | "MONTHLY"
  | "CUSTOM";

export type ServiceStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";

export interface ServiceRow {
  id: string;
  name: string;
  key: string;
  description: string | null;
  contentJson: unknown;
  contentText: string;
  category: string | null;
  duration: string | null;
  price: string | null; // Decimal serializes as string
  pricingType: ServicePricingType;
  imageUrl: string | null;
  icon: string;
  status: ServiceStatus;
  sortOrder: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const PRICING_TYPE_CONFIG: Record<
  ServicePricingType,
  { label: string; suffix: string }
> = {
  FIXED: { label: "Fixo", suffix: "" },
  HOURLY: { label: "Por hora", suffix: " / hora" },
  DAILY: { label: "Por dia", suffix: " / dia" },
  MONTHLY: { label: "Mensal", suffix: " / mês" },
  CUSTOM: { label: "Sob consulta", suffix: "" },
};

export const STATUS_CONFIG: Record<
  ServiceStatus,
  { label: string; className: string }
> = {
  DRAFT: { label: "Rascunho", className: "bg-zinc-100 text-zinc-700" },
  ACTIVE: { label: "Ativo", className: "bg-emerald-100 text-emerald-700" },
  ARCHIVED: { label: "Arquivado", className: "bg-amber-100 text-amber-700" },
};

export function formatPrice(
  price: string | null,
  pricingType: ServicePricingType
): string {
  if (pricingType === "CUSTOM") return "Sob consulta";
  if (price === null) return "—";
  const n = Number(price);
  if (Number.isNaN(n)) return "—";
  const formatted = n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return formatted + PRICING_TYPE_CONFIG[pricingType].suffix;
}
