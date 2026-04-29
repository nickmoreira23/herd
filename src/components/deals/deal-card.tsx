"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, User } from "lucide-react";
import {
  STAGE_CONFIG,
  contactDisplayName,
  formatAmount,
  type DealRow,
} from "./types";

export function DealCard({ deal }: { deal: DealRow }) {
  const stage = STAGE_CONFIG[deal.stage];
  const cn = contactDisplayName(deal.contact);
  return (
    <Link href={`/admin/blocks/deals/${deal.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold truncate flex-1">
              {deal.title}
            </h3>
            <span
              className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${stage.color}`}
            >
              {stage.label}
            </span>
          </div>

          <div className="text-sm font-medium">
            {formatAmount(deal.amount, deal.currency)}
            {deal.probability != null && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {deal.probability}%
              </span>
            )}
          </div>

          <div className="space-y-1 text-xs text-muted-foreground">
            {deal.company && (
              <div className="flex items-center gap-1 truncate">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{deal.company.name}</span>
              </div>
            )}
            {cn && (
              <div className="flex items-center gap-1 truncate">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{cn}</span>
              </div>
            )}
            {deal.expectedCloseDate && (
              <div className="truncate">
                📅 {new Date(deal.expectedCloseDate).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>

          {deal.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {deal.tags.slice(0, 3).map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
