"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const routeLabels: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  tiers: "Plans",
  commissions: "Commissions",
  partners: "Partners",
  financials: "Finances",
  new: "New Model",
  settings: "Settings",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 2) return null;

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = routeLabels[segment] || segment;
        const isLast = index === segments.length - 1;

        return (
          <span key={href} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link href={href} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
