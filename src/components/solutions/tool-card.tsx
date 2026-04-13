import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface ToolCardProps {
  href: string;
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
}

export function ToolCard({
  href,
  icon: Icon,
  iconColor,
  title,
  description,
}: ToolCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-card p-6 hover:border-foreground/20 transition-colors"
    >
      <div className="flex flex-col gap-4">
        <div
          className="rounded-lg p-3 w-fit"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon className="h-6 w-6" style={{ color: iconColor }} />
        </div>
        <div>
          <h3 className="font-semibold text-base group-hover:text-foreground transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
