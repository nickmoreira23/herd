import type { LucideIcon } from "lucide-react";

interface ComingSoonCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonCard({
  icon: Icon,
  title,
  description,
}: ComingSoonCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6 opacity-60">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted/50 p-3 w-fit">
          <Icon className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">{title}</h3>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              Coming soon
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
