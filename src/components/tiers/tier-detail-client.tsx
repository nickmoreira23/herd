"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { SubscriptionTier } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  MoreHorizontal,
  Copy,
  Trash2,
  Check,
  Loader2,
  Palette,
  DollarSign,
  Coins,
  Shield,
  ArrowUpDown,
  XCircle,
  Package,
  PanelRightClose,
  PanelRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  BLOCK_ICON_MAP,
  BLOCK_LABEL_MAP,
  BLOCKS_REQUIRING_TIER_ID,
  DEFAULT_BENEFIT_BLOCKS,
} from "@/lib/blocks/block-meta";

// Tabs
import { IdentityTab } from "./tabs/identity-tab";
import { PricingTab } from "./tabs/pricing-tab";
import { CreditsTab } from "./tabs/credits-tab";
import { AccessTab } from "./tabs/access-tab";
import { RulesTab } from "./tabs/rules-tab";
import { CancellationTab } from "./tabs/cancellation-tab";
import { ProductsTab } from "./tabs/products-tab";
import { AgentsTab } from "./tabs/agents-tab";
import { PartnersTab } from "./tabs/partners-tab";
import { CommunityTab } from "./tabs/community-tab";
import { PerksTab } from "./tabs/perks-tab";


// ─── Exported types for tab components ───────────────────────────────

export interface TierFormState {
  name: string;
  slug: string;
  iconUrl: string;
  tagline: string;
  colorAccent: string;
  description: string;
  highlightFeatures: string[];
  // Status
  status: string;
  visibility: string;
  isFeatured: boolean;
  // Pricing
  monthlyPrice: string;
  quarterlyPrice: string;
  annualPrice: string;
  quarterlyDisplay: string;
  annualDisplay: string;
  setupFee: string;
  trialDays: string;
  billingAnchor: string;
  // Credits
  monthlyCredits: string;
  creditExpirationDays: string;
  creditIssuing: string;
  rolloverMonths: string;
  rolloverCap: string;
  creditExpiry: string;
  annualBonusCredits: string;
  referralCreditAmt: string;
  partnerDiscountPercent: string;
  // Access
  maxMembers: string;
  geoRestriction: string;
  minimumAge: string;
  inviteOnly: boolean;
  repChannelOnly: boolean;
  upgradeToTierIds: string[];
  downgradeToTierIds: string[];
  upgradeTiming: string;
  downgradeTiming: string;
  creditOnUpgrade: string;
  creditOnDowngrade: string;
  // Cancellation
  minimumCommitMonths: string;
  cancelCreditBehavior: string;
  cancelCreditGraceDays: string;
  pauseAllowed: boolean;
  pauseMaxMonths: string;
  pauseCreditBehavior: string;
  winbackDays: string;
  winbackBonusCredits: string;
  exitSurveyRequired: boolean;
  // Features
  includedAIFeatures: string;
  apparelCadence: string;
  apparelBudget: string;
  // JSON configs
  agentConfig: unknown;
  communityConfig: unknown;
  perksConfig: unknown;
}

export interface TierPricingSnapshotSerialized {
  id: string;
  subscriptionTierId: string;
  monthlyPrice: number;
  quarterlyPrice: number | null;
  annualPrice: number | null;
  changedBy: string | null;
  reason: string | null;
  createdAt: string;
}

// ─── Nav config ─────────────────────────────────────────────────────

type NavItem = {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresTierId?: boolean;
};

const NAV_DETAILS: NavItem[] = [
  { key: "identity", label: "Identity", icon: Palette },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "credits", label: "Credits", icon: Coins },
  { key: "access", label: "Access", icon: Shield },
  { key: "rules", label: "Rules", icon: ArrowUpDown },
  { key: "cancellation", label: "Cancellation", icon: XCircle },
];

// Benefit tab renderer map — maps block names to their tab components
const BENEFIT_TAB_RENDERERS: Record<
  string,
  (props: {
    tierId: string;
    form: TierFormState;
    updateForm: (field: string, value: unknown) => void;
    rulesVersion: number;
    benefitsVersion: number;
    onBenefitSaved: () => void;
  }) => React.ReactNode
> = {
  products: ({ tierId, rulesVersion, onBenefitSaved }) => (
    <ProductsTab key={rulesVersion} tierId={tierId} onBenefitSaved={onBenefitSaved} />
  ),
  agents: ({ tierId, benefitsVersion, onBenefitSaved }) => <AgentsTab key={`agents-${benefitsVersion}`} tierId={tierId} onBenefitSaved={onBenefitSaved} />,
  partners: ({ tierId, benefitsVersion, onBenefitSaved }) => <PartnersTab key={`partners-${benefitsVersion}`} tierId={tierId} onBenefitSaved={onBenefitSaved} />,
  perks: ({ tierId, form, updateForm, benefitsVersion, onBenefitSaved }) => (
    <PerksTab key={`perks-${benefitsVersion}`} tierId={tierId} form={form} updateForm={updateForm} onBenefitSaved={onBenefitSaved} />
  ),
  community: ({ tierId, benefitsVersion, onBenefitSaved }) => <CommunityTab key={`community-${benefitsVersion}`} tierId={tierId} onBenefitSaved={onBenefitSaved} />,
};

// Placeholder for blocks that don't have a dedicated benefit tab yet
function GenericBenefitPlaceholder({ blockName }: { blockName: string }) {
  const Icon = BLOCK_ICON_MAP[blockName] || Package;
  const label = BLOCK_LABEL_MAP[blockName] || blockName;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-10 w-10 mb-3 opacity-50" />
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs mt-1">
        Benefit configuration for {label} is coming soon.
      </p>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────

function tierToForm(tier: SubscriptionTier): TierFormState {
  const t = tier as Record<string, unknown>;
  return {
    name: tier.name,
    slug: tier.slug,
    iconUrl: tier.iconUrl || "",
    tagline: (t.tagline as string) || "",
    colorAccent: (t.colorAccent as string) || "#6B7280",
    description: tier.description || "",
    highlightFeatures: tier.highlightFeatures || [],
    status: (t.status as string) || "DRAFT",
    visibility: (t.visibility as string) || "PUBLIC",
    isFeatured: tier.isFeatured,
    monthlyPrice: String(tier.monthlyPrice),
    quarterlyPrice: String(tier.quarterlyPrice),
    annualPrice: String(tier.annualPrice),
    quarterlyDisplay: t.quarterlyDisplay != null ? String(t.quarterlyDisplay) : "",
    annualDisplay: t.annualDisplay != null ? String(t.annualDisplay) : "",
    setupFee: String(t.setupFee ?? 0),
    trialDays: String(t.trialDays ?? 0),
    billingAnchor: (t.billingAnchor as string) || "SIGNUP_DATE",
    monthlyCredits: String(tier.monthlyCredits),
    creditExpirationDays: String(tier.creditExpirationDays),
    creditIssuing: (t.creditIssuing as string) || "ON_PAYMENT",
    rolloverMonths: String(t.rolloverMonths ?? 0),
    rolloverCap: t.rolloverCap != null ? String(t.rolloverCap) : "",
    creditExpiry: (t.creditExpiry as string) || "FORFEIT",
    annualBonusCredits: String(t.annualBonusCredits ?? 0),
    referralCreditAmt: String(t.referralCreditAmt ?? 0),
    partnerDiscountPercent: String(tier.partnerDiscountPercent),
    maxMembers: t.maxMembers != null ? String(t.maxMembers) : "",
    geoRestriction: Array.isArray(t.geoRestriction) ? (t.geoRestriction as string[]).join(", ") : "",
    minimumAge: t.minimumAge != null ? String(t.minimumAge) : "",
    inviteOnly: (t.inviteOnly as boolean) ?? false,
    repChannelOnly: (t.repChannelOnly as boolean) ?? false,
    upgradeToTierIds: (t.upgradeToTierIds as string[]) || [],
    downgradeToTierIds: (t.downgradeToTierIds as string[]) || [],
    upgradeTiming: (t.upgradeTiming as string) || "IMMEDIATE",
    downgradeTiming: (t.downgradeTiming as string) || "NEXT_CYCLE",
    creditOnUpgrade: (t.creditOnUpgrade as string) || "CARRY_OVER",
    creditOnDowngrade: (t.creditOnDowngrade as string) || "FORFEIT_EXCESS",
    minimumCommitMonths: String(t.minimumCommitMonths ?? 1),
    cancelCreditBehavior: (t.cancelCreditBehavior as string) || "FORFEIT",
    cancelCreditGraceDays: String(t.cancelCreditGraceDays ?? 0),
    pauseAllowed: (t.pauseAllowed as boolean) ?? false,
    pauseMaxMonths: String(t.pauseMaxMonths ?? 0),
    pauseCreditBehavior: (t.pauseCreditBehavior as string) || "FROZEN",
    winbackDays: String(t.winbackDays ?? 0),
    winbackBonusCredits: String(t.winbackBonusCredits ?? 0),
    exitSurveyRequired: (t.exitSurveyRequired as boolean) ?? false,
    includedAIFeatures: tier.includedAIFeatures.join(", "),
    apparelCadence: tier.apparelCadence,
    apparelBudget: tier.apparelBudget != null ? String(tier.apparelBudget) : "",
    agentConfig: t.agentConfig ?? null,
    communityConfig: t.communityConfig ?? null,
    perksConfig: t.perksConfig ?? null,
  };
}

function formToPayload(form: TierFormState) {
  return {
    name: form.name,
    slug: form.slug,
    iconUrl: form.iconUrl || undefined,
    tagline: form.tagline || undefined,
    colorAccent: form.colorAccent,
    description: form.description || undefined,
    highlightFeatures: form.highlightFeatures.filter(Boolean),
    status: form.status,
    visibility: form.visibility,
    isActive: form.status === "ACTIVE",
    isFeatured: form.isFeatured,
    monthlyPrice: parseFloat(form.monthlyPrice) || 0,
    quarterlyPrice: parseFloat(form.quarterlyPrice) || 0,
    annualPrice: parseFloat(form.annualPrice) || 0,
    quarterlyDisplay: form.quarterlyDisplay ? parseFloat(form.quarterlyDisplay) : undefined,
    annualDisplay: form.annualDisplay ? parseFloat(form.annualDisplay) : undefined,
    setupFee: parseFloat(form.setupFee) || 0,
    trialDays: parseInt(form.trialDays) || 0,
    billingAnchor: form.billingAnchor,
    monthlyCredits: parseFloat(form.monthlyCredits) || 0,
    creditExpirationDays: parseInt(form.creditExpirationDays) || 60,
    creditIssuing: form.creditIssuing,
    rolloverMonths: parseInt(form.rolloverMonths) || 0,
    rolloverCap: form.rolloverCap ? parseFloat(form.rolloverCap) : undefined,
    creditExpiry: form.creditExpiry,
    annualBonusCredits: parseFloat(form.annualBonusCredits) || 0,
    referralCreditAmt: parseFloat(form.referralCreditAmt) || 0,
    partnerDiscountPercent: parseFloat(form.partnerDiscountPercent) || 0,
    maxMembers: form.maxMembers ? parseInt(form.maxMembers) : undefined,
    geoRestriction: form.geoRestriction
      ? form.geoRestriction.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    minimumAge: form.minimumAge ? parseInt(form.minimumAge) : undefined,
    inviteOnly: form.inviteOnly,
    repChannelOnly: form.repChannelOnly,
    upgradeToTierIds: form.upgradeToTierIds,
    downgradeToTierIds: form.downgradeToTierIds,
    upgradeTiming: form.upgradeTiming,
    downgradeTiming: form.downgradeTiming,
    creditOnUpgrade: form.creditOnUpgrade,
    creditOnDowngrade: form.creditOnDowngrade,
    minimumCommitMonths: parseInt(form.minimumCommitMonths) || 1,
    cancelCreditBehavior: form.cancelCreditBehavior,
    cancelCreditGraceDays: parseInt(form.cancelCreditGraceDays) || 0,
    pauseAllowed: form.pauseAllowed,
    pauseMaxMonths: parseInt(form.pauseMaxMonths) || 0,
    pauseCreditBehavior: form.pauseCreditBehavior,
    winbackDays: parseInt(form.winbackDays) || 0,
    winbackBonusCredits: parseFloat(form.winbackBonusCredits) || 0,
    exitSurveyRequired: form.exitSurveyRequired,
    includedAIFeatures: form.includedAIFeatures
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    apparelCadence: form.apparelCadence,
    apparelBudget: form.apparelBudget ? parseFloat(form.apparelBudget) : undefined,
    agentConfig: form.agentConfig ?? undefined,
    communityConfig: form.communityConfig ?? undefined,
    perksConfig: form.perksConfig ?? undefined,
  };
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] px-1.5 py-0">
          Active
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px] px-1.5 py-0">
          Draft
        </Badge>
      );
    case "ARCHIVED":
      return (
        <Badge className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[11px] px-1.5 py-0">
          Archived
        </Badge>
      );
    default:
      return null;
  }
}

// ─── Props ───────────────────────────────────────────────────────────

interface TierDetailClientProps {
  tierId?: string;
  initialTier?: SubscriptionTier;
  allTiers?: { id: string; name: string }[];
  enabledBenefitBlocks?: string;
}

// ─── Component ───────────────────────────────────────────────────────

export function TierDetailClient({ tierId, initialTier, allTiers, enabledBenefitBlocks }: TierDetailClientProps) {
  const router = useRouter();
  const initialForm = useRef<TierFormState>(
    initialTier ? tierToForm(initialTier) : DEFAULT_FORM
  );
  const [form, setForm] = useState<TierFormState>(initialForm.current);
  const [activeTab, setActiveTab] = useState("identity");
  const [rightPanel, setRightPanel] = useState<"preview" | null>("preview");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm.current);

  // Dynamic benefit blocks
  const navBenefits: NavItem[] = useMemo(() => {
    const blocks = (enabledBenefitBlocks || DEFAULT_BENEFIT_BLOCKS)
      .split(",")
      .filter(Boolean);
    return blocks.map((name) => ({
      key: name,
      label: BLOCK_LABEL_MAP[name] || name,
      icon: BLOCK_ICON_MAP[name] || Package,
      requiresTierId: BLOCKS_REQUIRING_TIER_ID.has(name),
    }));
  }, [enabledBenefitBlocks]);

  // URL tab sync — read ?tab= search param to set active tab
  const searchParams = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get("tab");
    const allValidKeys = [
      ...NAV_DETAILS.map((d) => d.key),
      ...navBenefits.map((b) => b.key),
    ];
    if (tab && allValidKeys.includes(tab)) {
      setActiveTab(tab);
    } else if (!allValidKeys.includes(activeTab)) {
      setActiveTab("identity");
    }
  }, [searchParams, navBenefits, activeTab]);

  // Duplicate modal
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicating, setDuplicating] = useState(false);

  // Rules refresh — bumped when plan builder creates/deletes rules
  const [rulesVersion, setRulesVersion] = useState(0);

  // Benefits refresh — bumped when plan agent changes benefit assignments
  const [benefitsVersion, setBenefitsVersion] = useState(0);

  // Benefit saved indicator — flash the save button when benefit tabs auto-save
  const handleBenefitSaved = useCallback(() => {
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  }, []);

  // ─── Live updates from Plans Architect agent ──────────────────
  useEffect(() => {
    function handlePlanUpdated(e: Event) {
      const detail = (e as CustomEvent).detail as {
        planId: string;
        updatedFields?: Record<string, unknown>;
      };
      if (detail.planId !== tierId || !detail.updatedFields) return;

      // Update form state with new values from the agent
      setForm((prev) => {
        const next = { ...prev };
        const rec = next as unknown as Record<string, unknown>;
        for (const [key, value] of Object.entries(detail.updatedFields!)) {
          if (key in next) {
            // Convert values to the form's string-based format
            if (typeof value === "boolean" || Array.isArray(value)) {
              rec[key] = value;
            } else if (value === null || value === undefined) {
              rec[key] = "";
            } else {
              rec[key] = String(value);
            }
          }
        }
        return next;
      });

      // Also update the initial form ref so it doesn't show as dirty
      if (detail.updatedFields) {
        const ref = initialForm.current as unknown as Record<string, unknown>;
        for (const [key, value] of Object.entries(detail.updatedFields)) {
          if (key in initialForm.current) {
            if (typeof value === "boolean" || Array.isArray(value)) {
              ref[key] = value;
            } else if (value === null || value === undefined) {
              ref[key] = "";
            } else {
              ref[key] = String(value);
            }
          }
        }
      }

      // Flash save indicator
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    }

    function handleRulesChanged(e: Event) {
      const detail = (e as CustomEvent).detail as { planId: string };
      if (detail.planId === tierId) {
        setRulesVersion((v) => v + 1);
      }
    }

    function handleBenefitsChanged(e: Event) {
      const detail = (e as CustomEvent).detail as { planId: string };
      if (detail.planId === tierId) {
        setBenefitsVersion((v) => v + 1);
      }
    }

    window.addEventListener("plan-agent:plan-updated", handlePlanUpdated);
    window.addEventListener("plan-agent:rules-changed", handleRulesChanged);
    window.addEventListener("plan-agent:benefits-changed", handleBenefitsChanged);

    return () => {
      window.removeEventListener("plan-agent:plan-updated", handlePlanUpdated);
      window.removeEventListener("plan-agent:rules-changed", handleRulesChanged);
      window.removeEventListener("plan-agent:benefits-changed", handleBenefitsChanged);
    };
  }, [tierId]);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pricing snapshots from initial tier
  const pricingSnapshots = (initialTier as Record<string, unknown>)?.pricingSnapshots as
    | TierPricingSnapshotSerialized[]
    | undefined;

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleSave = useCallback(async () => {
    if (!tierId || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tiers/${tierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formToPayload(form)),
      });
      if (!res.ok) {
        const json = await res.json();
        const msg = json.error || "Failed to save";
        toast.error(msg);
        throw new Error(msg);
      }
      initialForm.current = { ...form };
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }, [form, tierId]);

  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      toast.error("Enter a name for the duplicate");
      return;
    }
    setDuplicating(true);
    try {
      const payload = formToPayload(form);
      const res = await fetch("/api/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          name: duplicateName.trim(),
          slug: `${form.slug}-copy-${Date.now()}`,
          status: "DRAFT",
          isActive: false,
          isFeatured: false,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to duplicate");
        return;
      }
      const newTier = await res.json();
      toast.success("Plan duplicated");
      setDuplicateOpen(false);
      setDuplicateName("");
      router.push(`/admin/tiers/${newTier.data.id}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDuplicating(false);
    }
  }, [duplicateName, form, router]);

  const handleDelete = useCallback(async () => {
    if (!tierId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/tiers/${tierId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to delete");
        return;
      }
      toast.success("Plan deleted");
      setDeleteOpen(false);
      router.push("/admin/tiers");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  }, [tierId, router]);

  return (
    <div className="flex flex-col -m-6 h-[calc(100vh-1px)]">
      {/* ── Header bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 border-b py-3 px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/admin/tiers"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Plans
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-foreground font-medium">{form.name || "New Plan"}</span>
          <div className="ml-1">{statusBadge(form.status)}</div>
        </nav>

        <div className="flex items-center gap-2">
          {/* Status select */}
          <Select
            value={form.status}
            onValueChange={(val) => {
              updateForm("status", val ?? "DRAFT");
              if (tierId) {
                fetch(`/api/tiers/${tierId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: val, isActive: val === "ACTIVE" }),
                }).then(() => toast.success(`Status changed to ${val?.toLowerCase()}`));
              }
            }}
          >
            <SelectTrigger className="w-[120px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Save button */}
          <Button
            size="sm"
            className={isDirty
              ? "bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
              : saved
                ? "bg-emerald-600 text-white hover:bg-emerald-600/90"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }
            onClick={handleSave}
            disabled={saving || (!isDirty && !saving && !saved)}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving
              </>
            ) : saved ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5" />
                Saved
              </>
            ) : (
              "Save"
            )}
          </Button>

          {/* Actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background h-8 w-8 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => {
                  setDuplicateName(`${form.name} (Copy)`);
                  setDuplicateOpen(true);
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteOpen(true)}
                className="text-red-500 focus:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Main 3-column layout ───────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* ── Left sidebar nav ─────────────────────────────────── */}
        <div className="w-[200px] shrink-0 border-r overflow-y-auto py-4 px-3">
          {/* Details group */}
          <div className="mb-5">
            <div className="px-2.5 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Details
              </span>
            </div>
            <div className="space-y-0.5">
              {NAV_DETAILS.map((item) => (
                <SidebarNavItem
                  key={item.key}
                  item={item}
                  active={activeTab === item.key}
                  onClick={() => setActiveTab(item.key)}
                />
              ))}
            </div>
          </div>

          {/* Benefits group (dynamic) */}
          {navBenefits.length > 0 && (
          <div>
            <div className="px-2.5 mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Benefits
              </span>
            </div>
            <div className="space-y-0.5">
              {navBenefits.map((item) => {
                const disabled = item.requiresTierId && !tierId;
                return (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    active={activeTab === item.key}
                    disabled={disabled}
                    onClick={() => {
                      if (!disabled) setActiveTab(item.key);
                    }}
                  />
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* ── Center editing area ──────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 min-w-0">
          {activeTab === "identity" && (
            <IdentityTab form={form} updateForm={updateForm} />
          )}
          {activeTab === "pricing" && (
            <PricingTab
              form={form}
              updateForm={updateForm}
              pricingSnapshots={pricingSnapshots}
            />
          )}
          {activeTab === "credits" && (
            <CreditsTab form={form} updateForm={updateForm} />
          )}
          {activeTab === "access" && (
            <AccessTab form={form} updateForm={updateForm} />
          )}
          {activeTab === "rules" && (
            <RulesTab
              form={form}
              updateForm={updateForm}
              allTiers={allTiers}
              currentTierId={tierId}
            />
          )}
          {activeTab === "cancellation" && (
            <CancellationTab form={form} updateForm={updateForm} />
          )}
          {/* Dynamic benefit tab rendering */}
          {navBenefits.some((b) => b.key === activeTab) &&
            (() => {
              if (!tierId && BLOCKS_REQUIRING_TIER_ID.has(activeTab)) return null;
              if (!tierId) {
                return (
                  <EmptyTierMessage
                    message={`Save the plan first to manage ${BLOCK_LABEL_MAP[activeTab] || activeTab}.`}
                  />
                );
              }
              const renderer = BENEFIT_TAB_RENDERERS[activeTab];
              return renderer
                ? renderer({ tierId, form, updateForm, rulesVersion, benefitsVersion, onBenefitSaved: handleBenefitSaved })
                : <GenericBenefitPlaceholder blockName={activeTab} />;
            })()}
        </div>

        {/* ── Right panel (Preview) ─────────────────────────────── */}
        {rightPanel ? (
          <div className="w-[320px] shrink-0 border-l flex flex-col bg-muted/5">
            {/* Panel header */}
            <div className="flex items-center border-b px-1 shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 -mb-px border-foreground text-foreground">
                <PanelRight className="h-3.5 w-3.5" />
                Preview
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setRightPanel(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Close panel"
              >
                <PanelRightClose className="h-4 w-4" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <PlanPreviewCard form={form} />
            </div>
          </div>
        ) : (
          <div className="w-10 shrink-0 border-l flex flex-col items-start pt-4 gap-4">
            <button
              onClick={() => setRightPanel("preview")}
              className="w-full flex flex-col items-center gap-2 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              title="Open preview"
            >
              <PanelRight className="h-4 w-4" />
              <span className="text-[10px] font-semibold uppercase tracking-wider [writing-mode:vertical-lr]">
                Preview
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Duplicate Dialog ───────────────────────────────────── */}
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Duplicate Plan
            </DialogTitle>
            <DialogDescription>
              Create a copy of this plan with a new name. All configuration will
              be duplicated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium">Plan Name</label>
            <Input
              placeholder="Plan name..."
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="text-sm"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateOpen(false)} disabled={duplicating}>
              Cancel
            </Button>
            <Button onClick={handleDuplicate} disabled={duplicating}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              {duplicating ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ──────────────────────────────────────── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4" />
              Delete Plan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{form.name}</strong>? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sidebar nav item ───────────────────────────────────────────────

function SidebarNavItem({
  item,
  active,
  disabled,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left
        ${active
          ? "bg-[#C5F135]/10 text-foreground font-medium"
          : disabled
            ? "text-muted-foreground/40 cursor-not-allowed"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }
      `}
    >
      <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? "text-[#C5F135]" : ""}`} />
      <span>{item.label}</span>
    </button>
  );
}

// ─── Empty state for unsaved tiers ──────────────────────────────────

function EmptyTierMessage({ message }: { message: string }) {
  return (
    <div className="text-sm text-muted-foreground py-12 text-center">
      {message}
    </div>
  );
}

// ─── Plan preview card ──────────────────────────────────────────────

function PlanPreviewCard({ form }: { form: TierFormState }) {
  const monthlyPrice = parseFloat(form.monthlyPrice) || 0;
  const monthlyCredits = parseFloat(form.monthlyCredits) || 0;
  const features = form.highlightFeatures.filter(Boolean);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Card top */}
      <div className="flex flex-col items-center pt-8 pb-4 px-5">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden mb-4">
          {form.iconUrl ? (
            <Image
              src={form.iconUrl}
              alt=""
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="text-xl font-bold text-muted-foreground/40">
              {form.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
        </div>

        {/* Name + tagline */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h3 className="font-semibold text-base">
              {form.name || "Plan Name"}
            </h3>
            {form.isFeatured && (
              <Badge className="bg-[#C5F135]/15 text-[#C5F135] border-[#C5F135]/30 text-[9px] px-1.5 py-0">
                Featured
              </Badge>
            )}
          </div>
          {form.tagline && (
            <p className="text-xs text-muted-foreground">{form.tagline}</p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t mx-5" />

      {/* Pricing section */}
      <div className="px-5 py-4 text-center space-y-1">
        <div>
          <span className="text-3xl font-bold tabular-nums">
            {formatCurrency(monthlyPrice)}
          </span>
          <span className="text-sm text-muted-foreground">/mo</span>
        </div>
        {monthlyCredits > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(monthlyCredits)} in monthly credits
          </p>
        )}
        {parseInt(form.trialDays) > 0 && (
          <p className="text-[11px] text-[#C5F135]">
            {form.trialDays}-day free trial
          </p>
        )}
      </div>

      {/* Features */}
      {(features.length > 0 || form.description) && (
        <>
          <div className="border-t mx-5" />
          <div className="px-5 py-4 space-y-3">
            {form.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {form.description}
              </p>
            )}

            {features.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  This plan includes
                </p>
                <ul className="space-y-2">
                  {features.slice(0, 8).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#C5F135] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom info */}
      <div className="border-t mx-5" />
      <div className="px-5 py-3 space-y-1.5">
        {parseFloat(form.setupFee) > 0 && (
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Setup fee</span>
            <span className="tabular-nums">{formatCurrency(parseFloat(form.setupFee))}</span>
          </div>
        )}
        {parseInt(form.minimumCommitMonths) > 1 && (
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Min. commitment</span>
            <span className="tabular-nums">{form.minimumCommitMonths} months</span>
          </div>
        )}
        {form.pauseAllowed && (
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground">Pause allowed</span>
            <span>Up to {form.pauseMaxMonths} months</span>
          </div>
        )}
        <div className="flex justify-between text-[11px]">
          <span className="text-muted-foreground">Visibility</span>
          <span className="capitalize">{form.visibility.toLowerCase().replace("_", " ")}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Default form for new tiers ──────────────────────────────────────

const DEFAULT_FORM: TierFormState = {
  name: "",
  slug: "",
  iconUrl: "",
  tagline: "",
  colorAccent: "#6B7280",
  description: "",
  highlightFeatures: [],
  status: "DRAFT",
  visibility: "PUBLIC",
  isFeatured: false,
  monthlyPrice: "",
  quarterlyPrice: "",
  annualPrice: "",
  quarterlyDisplay: "",
  annualDisplay: "",
  setupFee: "0",
  trialDays: "0",
  billingAnchor: "SIGNUP_DATE",
  monthlyCredits: "",
  creditExpirationDays: "60",
  creditIssuing: "ON_PAYMENT",
  rolloverMonths: "0",
  rolloverCap: "",
  creditExpiry: "FORFEIT",
  annualBonusCredits: "0",
  referralCreditAmt: "0",
  partnerDiscountPercent: "0",
  maxMembers: "",
  geoRestriction: "",
  minimumAge: "",
  inviteOnly: false,
  repChannelOnly: false,
  upgradeToTierIds: [],
  downgradeToTierIds: [],
  upgradeTiming: "IMMEDIATE",
  downgradeTiming: "NEXT_CYCLE",
  creditOnUpgrade: "CARRY_OVER",
  creditOnDowngrade: "FORFEIT_EXCESS",
  minimumCommitMonths: "1",
  cancelCreditBehavior: "FORFEIT",
  cancelCreditGraceDays: "0",
  pauseAllowed: false,
  pauseMaxMonths: "0",
  pauseCreditBehavior: "FROZEN",
  winbackDays: "0",
  winbackBonusCredits: "0",
  exitSurveyRequired: false,
  includedAIFeatures: "",
  apparelCadence: "NONE",
  apparelBudget: "",
  agentConfig: null,
  communityConfig: null,
  perksConfig: null,
};
