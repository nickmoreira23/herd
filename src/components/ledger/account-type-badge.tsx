import { Badge } from "@/components/ui/badge";

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  ASSET: { label: "Asset", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
  LIABILITY: { label: "Liability", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  REVENUE: { label: "Revenue", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  EXPENSE: { label: "Expense", className: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
  EQUITY: { label: "Equity", className: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
};

interface AccountTypeBadgeProps {
  type: string;
}

export function AccountTypeBadge({ type }: AccountTypeBadgeProps) {
  const config = TYPE_CONFIG[type] ?? { label: type, className: "" };
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
