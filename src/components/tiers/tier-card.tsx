"use client";

import { useState } from "react";
import Image from "next/image";
import type { SubscriptionTier } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ShoppingBag,
  Bot,
  Handshake,
  Sparkles,
  Users,
  Store,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────

interface RedemptionRuleSerialized {
  id: string;
  redemptionType: string;
  scopeType: string;
  scopeValue: string;
  discountPercent: number;
}

interface AgentAccessSerialized {
  id: string;
  agent: { id: string; name: string; category: string; icon: string };
}

interface PartnerAssignmentSerialized {
  id: string;
  discountPercent: number;
  partner: { id: string; name: string; logoUrl: string | null };
}

interface TierCardProps {
  tier: SubscriptionTier & {
    redemptionRules?: RedemptionRuleSerialized[];
    agentAccess?: AgentAccessSerialized[];
    partnerAssignments?: PartnerAssignmentSerialized[];
  };
  onDuplicate: (tier: SubscriptionTier) => void;
  onArchive: (tier: SubscriptionTier) => void;
  onDelete: (tier: SubscriptionTier) => void;
}

// ─── Label maps ─────────────────────────────────────────────

const COMMUNITY_LABELS: Record<string, string> = {
  private_discord: "Private Discord Channel",
  group_coaching: "Group Coaching Calls",
  member_forum: "Members Forum",
  accountability_pods: "Accountability Pods",
  local_meetups: "Local Meetups",
};

const PERK_LABELS: Record<string, string> = {
  free_shipping: "Free Shipping",
  birthday_credits: "Birthday Credits",
  priority_support: "Priority Support",
  early_access: "Early Access",
  gift_box: "Welcome Gift Box",
  exclusive_content: "Exclusive Content",
};

// ─── Status badge ───────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-2 py-0.5">
          Active
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px] px-2 py-0.5">
          Draft
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[10px] px-2 py-0.5">
          Archived
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Scope label helper ─────────────────────────────────────

function scopeLabel(rule: RedemptionRuleSerialized) {
  if (rule.scopeType === "CATEGORY")
    return rule.scopeValue.charAt(0) + rule.scopeValue.slice(1).toLowerCase();
  if (rule.scopeType === "SUB_CATEGORY") return rule.scopeValue;
  return rule.scopeValue;
}

function scopeTag(scopeType: string) {
  if (scopeType === "SKU") return "SKU";
  if (scopeType === "SUB_CATEGORY") return "Sub-Cat";
  return "Category";
}

// ─── Main Component ────────────────────────────────────────

export function TierCard({ tier, onDuplicate, onArchive, onDelete }: TierCardProps) {
  const router = useRouter();

  const t = tier as unknown as Record<string, unknown>;
  const status = (t.status as string) || "DRAFT";
  const description = tier.description || null;

  // Pillar data
  const storeRules =
    tier.redemptionRules?.filter((r) => r.redemptionType === "MEMBERS_STORE") || [];
  const rateRules =
    tier.redemptionRules?.filter((r) => r.redemptionType === "MEMBERS_RATE") || [];
  const agents = tier.agentAccess || [];
  const partners = tier.partnerAssignments || [];
  const communityConfig = (t.communityConfig as Record<string, boolean>) || {};
  const perksConfig = (t.perksConfig as Record<string, { enabled: boolean }>) || {};

  const enabledCommunity = Object.entries(communityConfig).filter(([, v]) => v);
  const enabledPerks = Object.entries(perksConfig).filter(([, v]) => v?.enabled);

  const productCount = storeRules.length + rateRules.length;
  const agentCount = agents.length;
  const partnerCount = partners.length;
  const communityCount = enabledCommunity.length;
  const perkCount = enabledPerks.length;

  return (
    <div className="rounded-xl border bg-card overflow-hidden group flex flex-col h-full">
      {/* ── Card Header ─────────────────────────────────── */}
      <div className="relative" style={{ paddingTop: 32 }}>
        {/* Status badge — top left */}
        <div className="absolute top-2.5 left-3">{statusBadge(status)}</div>

        {/* Options menu — top right */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => router.push(`/admin/tiers/${tier.id}`)}>
                Edit Plan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(tier)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {status === "ACTIVE" ? (
                <DropdownMenuItem onClick={() => onArchive(tier)}>
                  Archive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(tier)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Icon — centered */}
        <div className="flex justify-center">
          <Link href={`/admin/tiers/${tier.id}`}>
            {tier.iconUrl ? (
              <Image
                src={tier.iconUrl}
                alt=""
                width={160}
                height={160}
                className="object-contain"
                style={{ width: 160, height: 160 }}
              />
            ) : (
              <div className="rounded-2xl flex items-center justify-center bg-muted text-muted-foreground font-bold text-3xl border-2 border-border shadow-sm" style={{ width: 160, height: 160 }}>
                {tier.name?.charAt(0)?.toUpperCase() || "?"}
              </div>
            )}
          </Link>
        </div>
      </div>

      {/* ── Card Body ───────────────────────────────────── */}
      <div className="px-5 pt-4 pb-5 flex flex-col flex-1 overflow-y-auto min-h-0">
        {/* Title */}
        <div className="text-center mb-3">
          <Link href={`/admin/tiers/${tier.id}`} className="group/link">
            <h3 className="font-semibold text-base group-hover/link:text-[#C5F135] transition-colors">
              {tier.name}
            </h3>
          </Link>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Price */}
        <div className="text-center mb-3">
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-2xl font-bold tabular-nums">
              {formatCurrency(Number(tier.monthlyPrice))}
            </span>
            <span className="text-sm text-muted-foreground">/mo</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {formatCurrency(Number(tier.monthlyCredits))} in monthly credits
          </p>
        </div>

        {/* Section label */}
        <p className="text-xs text-muted-foreground mb-3">This plan includes:</p>

        {/* ── Five Pillars ────────────────────────────── */}
        <div className="flex-1" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Products */}
          <PillarSection
            icon={ShoppingBag}
            label="Products"
            count={productCount}
            subtitle={storeRules.length > 0 ? `${scopeLabel(storeRules[0])} ${storeRules[0].discountPercent}% off` : rateRules.length > 0 ? `${scopeLabel(rateRules[0])} ${rateRules[0].discountPercent}% off` : undefined}
            defaultOpen={productCount > 0}
          >
            {productCount === 0 ? (
              <EmptyPillar />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {storeRules.length > 0 && (
                  <div className="rounded-md border overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                    <div className="flex items-center gap-1.5 px-2.5 border-b" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: "#F5F5F5" }}>
                      <Store className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">Members Store</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {storeRules.map((r) => (
                        <RuleRow key={r.id} rule={r} />
                      ))}
                    </div>
                  </div>
                )}
                {rateRules.length > 0 && (
                  <div className="rounded-md border overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                    <div className="flex items-center gap-1.5 px-2.5 border-b" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: "#F5F5F5" }}>
                      <CreditCard className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">Members Rate</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {rateRules.map((r) => (
                        <RuleRow key={r.id} rule={r} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </PillarSection>

          {/* Agents */}
          <PillarSection icon={Bot} label="Agents" count={agentCount} subtitle={agents.length > 0 ? agents[0].agent.name : undefined} defaultOpen={false}>
            {agentCount === 0 ? (
              <EmptyPillar />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(
                  agents.reduce<Record<string, AgentAccessSerialized[]>>((acc, a) => {
                    const cat = a.agent.category || "Other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(a);
                    return acc;
                  }, {})
                ).map(([category, categoryAgents]) => (
                  <div key={category} className="rounded-md border overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                    <div className="flex items-center gap-1.5 px-2.5 border-b" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: "#F5F5F5" }}>
                      <Bot className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-semibold text-muted-foreground">{category}</span>
                    </div>
                    <div className="divide-y divide-border/50">
                      {categoryAgents.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 px-2.5" style={{ paddingTop: 10, paddingBottom: 10 }}>
                          <span className="text-[10px] text-muted-foreground shrink-0">{a.agent.icon}</span>
                          <span className="text-[11px] flex-1 truncate">{a.agent.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PillarSection>

          {/* Partners */}
          <PillarSection icon={Handshake} label="Partners" count={partnerCount} subtitle={partners.length > 0 ? partners[0].partner.name : undefined} defaultOpen={false}>
            {partnerCount === 0 ? (
              <EmptyPillar />
            ) : (
              <div className="rounded-md border overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="flex items-center gap-1.5 px-2.5 border-b" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: "#F5F5F5" }}>
                  <Handshake className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Partner Network</span>
                </div>
                <div className="divide-y divide-border/50">
                  {partners.map((p) => (
                    <div key={p.id} className="flex items-center gap-2 px-2.5" style={{ paddingTop: 10, paddingBottom: 10 }}>
                      {p.partner.logoUrl ? (
                        <Image
                          src={p.partner.logoUrl}
                          alt=""
                          width={16}
                          height={16}
                          className="w-4 h-4 rounded object-cover"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded bg-muted flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                          {p.partner.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-[11px] flex-1 truncate">{p.partner.name}</span>
                      {p.discountPercent > 0 && (
                        <span className="text-[11px] font-semibold tabular-nums shrink-0">
                          {p.discountPercent}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PillarSection>

          {/* Perks */}
          <PillarSection icon={Sparkles} label="Perks" count={perkCount} subtitle={enabledPerks.length > 0 ? PERK_LABELS[enabledPerks[0][0]] || enabledPerks[0][0] : undefined} defaultOpen={false}>
            {perkCount === 0 ? (
              <EmptyPillar />
            ) : (
              <div className="rounded-md border overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="flex items-center gap-1.5 px-2.5 border-b" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: "#F5F5F5" }}>
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Member Perks</span>
                </div>
                <div className="divide-y divide-border/50">
                  {enabledPerks.map(([key]) => (
                    <div key={key} className="flex items-center gap-2 px-2.5" style={{ paddingTop: 10, paddingBottom: 10 }}>
                      <Sparkles className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] flex-1">{PERK_LABELS[key] || key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PillarSection>

          {/* Community */}
          <PillarSection icon={Users} label="Community" count={communityCount} subtitle={enabledCommunity.length > 0 ? COMMUNITY_LABELS[enabledCommunity[0][0]] || enabledCommunity[0][0] : undefined} defaultOpen={false}>
            {communityCount === 0 ? (
              <EmptyPillar />
            ) : (
              <div className="rounded-md border overflow-hidden" style={{ backgroundColor: "#FFFFFF" }}>
                <div className="flex items-center gap-1.5 px-2.5 border-b" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: "#F5F5F5" }}>
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Community Access</span>
                </div>
                <div className="divide-y divide-border/50">
                  {enabledCommunity.map(([key]) => (
                    <div key={key} className="flex items-center gap-2 px-2.5" style={{ paddingTop: 10, paddingBottom: 10 }}>
                      <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-[11px] flex-1">{COMMUNITY_LABELS[key] || key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </PillarSection>
        </div>
      </div>
    </div>
  );
}

// ─── Pillar Section (chevron on right of count) ─────────────

function PillarSection({
  icon: Icon,
  label,
  count,
  subtitle,
  defaultOpen,
  children,
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  subtitle?: string;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 text-left hover:bg-muted/30 transition-colors"
        style={{ paddingTop: 12, paddingBottom: 12 }}
      >
        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium">{label}</span>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="text-[10px] tabular-nums text-muted-foreground min-w-[12px] text-right">
          {count > 0 ? count : ""}
        </span>
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && <div style={{ padding: 12 }}>{children}</div>}
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────

function EmptyPillar() {
  return (
    <p className="text-[11px] text-muted-foreground italic py-1 px-0.5">Not configured</p>
  );
}

function RuleRow({ rule }: { rule: RedemptionRuleSerialized }) {
  return (
    <div className="flex items-center gap-2 px-2.5" style={{ paddingTop: 10, paddingBottom: 10 }}>
      <span className="text-[10px] text-muted-foreground w-10 shrink-0">{scopeTag(rule.scopeType)}</span>
      <span className="text-[11px] flex-1 truncate">{scopeLabel(rule)}</span>
      <span className="text-[11px] font-semibold tabular-nums shrink-0">{rule.discountPercent}%</span>
    </div>
  );
}
