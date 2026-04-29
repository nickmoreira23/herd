"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  STATUS_CONFIG,
  CHANNEL_CONFIG,
  budgetProgress,
  formatAmount,
  type CampaignRow,
} from "./types";

export function CampaignCard({ campaign }: { campaign: CampaignRow }) {
  const status = STATUS_CONFIG[campaign.status];
  const progress = budgetProgress(campaign.spent, campaign.budget);

  return (
    <Link href={`/admin/blocks/campaigns/${campaign.id}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold truncate flex-1">
              {campaign.name}
            </h3>
            <span
              className={`shrink-0 text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${status.color}`}
            >
              {status.label}
            </span>
          </div>

          {campaign.channels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {campaign.channels.slice(0, 4).map((ch) => {
                const cfg = CHANNEL_CONFIG[ch];
                return (
                  <span
                    key={ch}
                    className="text-[10px] inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5"
                  >
                    {cfg.emoji} {cfg.label}
                  </span>
                );
              })}
              {campaign.channels.length > 4 && (
                <span className="text-[10px] text-muted-foreground">
                  +{campaign.channels.length - 4}
                </span>
              )}
            </div>
          )}

          <div className="space-y-1 text-xs text-muted-foreground">
            {(campaign.startDate || campaign.endDate) && (
              <div className="truncate">
                📅{" "}
                {campaign.startDate
                  ? new Date(campaign.startDate).toLocaleDateString("pt-BR")
                  : "—"}{" "}
                →{" "}
                {campaign.endDate
                  ? new Date(campaign.endDate).toLocaleDateString("pt-BR")
                  : "—"}
              </div>
            )}
            {campaign.budget && (
              <div className="truncate">
                💰 {formatAmount(campaign.spent ?? "0", campaign.currency)} /{" "}
                {formatAmount(campaign.budget, campaign.currency)}
              </div>
            )}
            {campaign.dealCount !== undefined && campaign.dealCount > 0 && (
              <div>🎯 {campaign.dealCount} oportunidades</div>
            )}
          </div>

          {progress && (
            <div className="h-1 w-full rounded bg-muted overflow-hidden">
              <div
                className={`h-full ${
                  progress.over ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          )}

          {campaign.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {campaign.tags.slice(0, 3).map((t) => (
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
