import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared empty-state for list pages (Sub-27b). Reproduces the "family A"
 * visual exactly: a full-height dashed-border card with a colored rounded
 * icon, a title, an optional description, and an optional action button.
 *
 * Colors are a fixed map (Tailwind needs literal class names — dynamic
 * `bg-${x}-500/10` would not be generated). `chat-empty-state` and the
 * standalone/`card` variants (marketplace, pages, forms) are intentionally
 * NOT covered here — their markup differs and forcing them would change the
 * look.
 */
const ICON_COLORS = {
  primary: { bg: "bg-primary/10", fg: "text-primary" },
  orange: { bg: "bg-orange-500/10", fg: "text-orange-500" },
  blue: { bg: "bg-blue-500/10", fg: "text-blue-500" },
  violet: { bg: "bg-violet-500/10", fg: "text-violet-500" },
  purple: { bg: "bg-purple-500/10", fg: "text-purple-500" },
  emerald: { bg: "bg-emerald-500/10", fg: "text-emerald-500" },
} as const;

export type EmptyStateIconColor = keyof typeof ICON_COLORS;

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: LucideIcon;
  variant?: "default" | "outline";
  disabled?: boolean;
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  iconColor?: EmptyStateIconColor;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /** "page" (default) = full-height dashed card (family A). */
  variant?: "page";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  iconColor = "primary",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const color = ICON_COLORS[iconColor];
  const ActionIcon = action?.icon;

  const button = action ? (
    <Button
      variant={action.variant ?? "outline"}
      onClick={action.href ? undefined : action.onClick}
      disabled={action.disabled}
    >
      {ActionIcon ? <ActionIcon className="mr-2 h-4 w-4" /> : null}
      {action.label}
    </Button>
  ) : null;

  return (
    <div
      className={cn(
        "flex-1 flex flex-col items-center justify-center text-center rounded-xl border border-dashed bg-card",
        className,
      )}
    >
      {Icon ? (
        <div className={cn("flex items-center justify-center h-16 w-16 rounded-2xl mb-5", color.bg)}>
          <Icon className={cn("h-8 w-8", color.fg)} />
        </div>
      ) : null}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      ) : null}
      {action?.href ? <Link href={action.href}>{button}</Link> : button}
    </div>
  );
}
