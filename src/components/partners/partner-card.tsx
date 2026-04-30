"use client";

import Image from "next/image";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Globe } from "lucide-react";
import { toNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/t";
import { formatNumberAsMoney } from "@/lib/money/format";
import type { KickbackType } from "@/types";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface PartnerCardProps {
  partner: PartnerWithAssignments;
  locale: Locale;
  onEdit: (partner: PartnerWithAssignments) => void;
  onDelete: (partner: PartnerWithAssignments) => void;
}

const KICKBACK_TYPE_KEYS = {
  NONE: "partner.kickback_type.NONE",
  PERCENT_OF_SALE: "partner.kickback_type.PERCENT_OF_SALE",
  FLAT_PER_REFERRAL: "partner.kickback_type.FLAT_PER_REFERRAL",
  FLAT_PER_MONTH: "partner.kickback_type.FLAT_PER_MONTH",
} as const satisfies Record<KickbackType, MessageKey>;

export function PartnerCard({ partner, locale, onEdit, onDelete }: PartnerCardProps) {
  const t = useT();

  const initials = partner.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activeAssignments = partner.tierAssignments.filter((a) => a.isActive);
  const kickbackType = partner.kickbackType as KickbackType;

  return (
    <div
      className={`rounded-lg border p-4 ${
        partner.isActive ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {partner.logoUrl ? (
            <Image
              src={partner.logoUrl}
              alt={partner.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-bold">
              {initials}
            </div>
          )}
          <div>
            <h3 className="font-semibold">{partner.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs">
                {partner.category}
              </Badge>
              {!partner.isActive && (
                <Badge variant="secondary" className="text-xs">
                  {t("partners.card.inactive")}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {partner.websiteUrl && (
            <Button
              variant="ghost"
              size="icon-sm"
              render={<a href={partner.websiteUrl} target="_blank" rel="noopener noreferrer" />}
            >
              <Globe className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(partner)}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onDelete(partner)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {partner.discountDescription && (
        <p className="mt-2 text-xs text-muted-foreground">
          {partner.discountDescription}
        </p>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground text-xs">
            {t("partners.card.kickback_label")}
          </span>
          <p className="font-medium">
            {t(KICKBACK_TYPE_KEYS[kickbackType])}
            {partner.kickbackValue && partner.kickbackType !== "NONE" && (
              <span className="ml-1 text-muted-foreground">
                {partner.kickbackType === "PERCENT_OF_SALE"
                  ? `${toNumber(partner.kickbackValue)}%`
                  : formatNumberAsMoney(toNumber(partner.kickbackValue), locale)}
              </span>
            )}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground text-xs">
            {t("partners.card.tier_discounts_label")}
          </span>
          <p className="font-medium">
            {t("partners.card.tiers_count", { count: activeAssignments.length })}
          </p>
        </div>
      </div>

      {activeAssignments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {activeAssignments.map((a) => (
            <Badge key={a.id} variant="secondary" className="text-xs">
              {a.tier.name}
              {": "}
              {toNumber(a.discountPercent)}
              {"%"}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
