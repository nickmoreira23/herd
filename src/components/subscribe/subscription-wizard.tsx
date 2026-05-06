"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Bot,
  Handshake,
  ShoppingBag,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  PartyPopper,
  Coins,
  X,
  Tag,
  Truck,
  Gift,
  Headphones,
  Zap,
  Star,
  MessagesSquare,
  MessageCircle,
  UserCheck,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

export interface SubscribeTier {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  iconUrl: string | null;
  colorAccent: string;
  highlightFeatures: string[];
  monthlyPrice: number;
  biannualPrice: number;
  annualPrice: number;
  biannualDisplay: number | null;
  annualDisplay: number | null;
  monthlyCredits: number;
  annualBonusCredits: number;
  redemptionRules: Array<{
    id: string;
    redemptionType: string;
    scopeType: string;
    scopeValue: string;
    discountPercent: number;
  }>;
  agents: Array<{
    id: string;
    name: string;
    category: string;
    icon: string;
  }>;
  partners: Array<{
    id: string;
    name: string;
    logoUrl: string | null;
    discountPercent: number;
  }>;
  perksConfig: Record<string, { enabled: boolean }>;
  communityConfig: Record<string, boolean>;
}

export interface SubscribePackage {
  id: string;
  variantId: string;
  name: string;
  slug: string;
  fitnessGoal: string;
  description: string | null;
  imageUrl: string | null;
  isComplete: boolean;
  creditsUsed: number;
  products: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    quantity: number;
  }>;
}

interface Brand {
  name: string;
  iconUrl: string | null;
}

interface Props {
  tier: SubscribeTier;
  packages: SubscribePackage[];
  brand: Brand;
}

// ─── Label maps (mirror tier-card) ───────────────────────────

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

const PERK_ICONS: Record<string, LucideIcon> = {
  free_shipping: Truck,
  birthday_credits: Gift,
  priority_support: Headphones,
  early_access: Zap,
  gift_box: Gift,
  exclusive_content: Star,
};

const COMMUNITY_ICONS: Record<string, LucideIcon> = {
  private_discord: MessagesSquare,
  group_coaching: Users,
  member_forum: MessageCircle,
  accountability_pods: UserCheck,
  local_meetups: MapPin,
};

/** HERD brand red — used for every section icon and accent. */
const BRAND_RED = "#e22627";

type Step = 1 | 2 | 3 | 4;
type BillingCycle = "monthly" | "biannual" | "annual";

// ─── Component ────────────────────────────────────────────────

export function SubscriptionWizard({ tier, packages, brand }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  const enabledPerks = useMemo(
    () =>
      Object.entries(tier.perksConfig)
        .filter(([, v]) => v?.enabled)
        .map(([k]) => k),
    [tier.perksConfig],
  );
  const enabledCommunity = useMemo(
    () =>
      Object.entries(tier.communityConfig)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [tier.communityConfig],
  );

  const selectedPackage = packages.find((p) => p.id === selectedPackageId) ?? null;
  const expandedPackage = packages.find((p) => p.id === expandedPackageId) ?? null;

  // Pricing
  const cyclePrice =
    cycle === "monthly"
      ? tier.monthlyPrice
      : cycle === "biannual"
        ? tier.biannualDisplay ?? tier.biannualPrice
        : tier.annualDisplay ?? tier.annualPrice;
  const cycleSuffix =
    cycle === "monthly" ? "/mo" : cycle === "biannual" ? "/mo" : "/mo";
  // The biannual / annual prices are ALREADY the per-month rate the
  // customer pays when prepaying — no division needed.
  const monthlyEquivalent = cyclePrice;

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Header — sticky, centered brand + stepper */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-5 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            {brand.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.iconUrl}
                alt={brand.name}
                className="h-12 w-12 rounded-md object-contain"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-foreground/10 flex items-center justify-center text-foreground font-bold text-base">
                {brand.name.charAt(0).toUpperCase()}
              </div>
            )}
            <p className="text-base font-bold tracking-tight leading-tight">
              {brand.name}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              Fitness Plan
            </p>
          </div>

          {step < 4 && <Stepper current={step} />}
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {step === 1 && (
          <Step1Includes
            tier={tier}
            enabledPerks={enabledPerks}
            enabledCommunity={enabledCommunity}
          />
        )}
        {step === 2 && (
          <Step2Packages
            packages={packages}
            selectedId={selectedPackageId}
            expandedId={expandedPackageId}
            expanded={expandedPackage}
            onExpand={(id) =>
              setExpandedPackageId((prev) => (prev === id || id === "" ? null : id))
            }
            onSelect={(id) => setSelectedPackageId(id)}
          />
        )}
        {step === 3 && (
          <Step3Checkout
            tier={tier}
            selectedPackage={selectedPackage}
            cycle={cycle}
            onCycleChange={setCycle}
            cyclePrice={cyclePrice}
            cycleSuffix={cycleSuffix}
            monthlyEquivalent={monthlyEquivalent}
            form={form}
            setForm={setForm}
          />
        )}
        {step === 4 && <Step4ThankYou tier={tier} />}
      </main>

      {/* Footer / Nav */}
      {step < 4 && (
        <footer className="border-t border-border bg-card sticky bottom-0">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() =>
                step === 1
                  ? router.back()
                  : setStep((s) => Math.max(1, (s - 1) as Step) as Step)
              }
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {step === 1 ? "Back" : "Previous"}
            </Button>

            {step === 1 && (
              <Button onClick={() => setStep(2)}>
                Choose your package
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 2 && (
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedPackageId}
              >
                Continue to checkout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
            {step === 3 && (
              <Button
                onClick={() => setStep(4)}
                className="bg-[#C5F135] text-black hover:bg-[#C5F135]/90"
              >
                Activate subscription
                <CircleCheckBig className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

// ─── Stepper ───────────────────────────────────────────────────

function Stepper({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Benefits" },
    { n: 2, label: "Package" },
    { n: 3, label: "Checkout" },
  ];
  return (
    <ol className="flex items-start text-sm">
      {steps.map((s, idx) => {
        const active = current === s.n;
        const done = current > s.n;
        const reached = active || done;
        return (
          <li
            key={s.n}
            className={cn(
              "flex items-start",
              idx < steps.length - 1 && "flex-1",
            )}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border",
                  reached
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : s.n}
              </span>
              <span
                className={cn(
                  "text-xs font-medium whitespace-nowrap",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "flex-1 h-px mt-3.5 mx-2",
                  done ? "bg-foreground" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Step 1: Includes ──────────────────────────────────────────

function Step1Includes({
  tier,
  enabledPerks,
  enabledCommunity,
}: {
  tier: SubscribeTier;
  enabledPerks: string[];
  enabledCommunity: string[];
}) {
  const hasProducts = tier.redemptionRules.length > 0;
  const hasAgents = tier.agents.length > 0;
  const hasPartners = tier.partners.length > 0;
  const hasPerks = enabledPerks.length > 0;
  const hasCommunity = enabledCommunity.length > 0;
  const hasAnySection =
    hasProducts || hasAgents || hasPartners || hasPerks || hasCommunity;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-4">
        {tier.iconUrl ? (
          <Image
            src={tier.iconUrl}
            alt={tier.name}
            width={156}
            height={156}
            className="rounded-2xl object-contain"
          />
        ) : (
          <div
            className="h-[156px] w-[156px] rounded-2xl flex items-center justify-center text-white font-bold text-5xl"
            style={{ backgroundColor: tier.colorAccent }}
          >
            {tier.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tier.name}</h1>
          {tier.tagline && (
            <p className="text-muted-foreground mt-1">{tier.tagline}</p>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {formatCurrency(tier.monthlyPrice)}
          </span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
        {tier.monthlyCredits > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Coins className="h-3 w-3" />
            {formatCurrency(tier.monthlyCredits)} in monthly credits
          </Badge>
        )}
        {tier.description && (
          <p className="max-w-xl text-sm text-muted-foreground">
            {tier.description}
          </p>
        )}
      </section>

      {/* Highlights */}
      {tier.highlightFeatures.length > 0 && (
        <section className="rounded-xl border bg-card p-6">
          <h2 className="text-base font-semibold mb-3">What's included</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tier.highlightFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 mt-0.5 shrink-0 text-foreground" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Rich vertical sections — one per benefit category */}
      <div className="space-y-6">
        {hasProducts && (
          <RichSection
            icon={ShoppingBag}
            title="Products"
            subtitle="Members-only pricing across the catalog"
            count={tier.redemptionRules.length}
          >
            <ProductsGrouped rules={tier.redemptionRules} />
          </RichSection>
        )}

        {hasAgents && (
          <RichSection
            icon={Bot}
            title="AI Agents"
            subtitle="Personal AI coaches included with your plan"
            count={tier.agents.length}
          >
            <ul className="divide-y divide-border">
              {tier.agents.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-4 py-3"
                >
                  <ItemAvatar icon={Bot} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">
                      {a.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.category}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </RichSection>
        )}

        {hasPartners && (
          <RichSection
            icon={Handshake}
            title="Partner Brands"
            subtitle="Exclusive discounts at partners we love"
            count={tier.partners.length}
          >
            <ul className="divide-y divide-border">
              {tier.partners.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-4 py-3"
                >
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logoUrl}
                      alt={p.name}
                      className="h-12 w-12 shrink-0 rounded-xl object-contain bg-white ring-1 ring-border p-1"
                    />
                  ) : (
                    <ItemAvatar icon={Handshake} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight">
                      {p.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Member discount
                    </p>
                  </div>
                  <DiscountBadge value={p.discountPercent} />
                </li>
              ))}
            </ul>
          </RichSection>
        )}

        {hasPerks && (
          <RichSection
            icon={Sparkles}
            title="Member Perks"
            subtitle="Little extras that make a big difference"
            count={enabledPerks.length}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enabledPerks.map((k) => {
                const PerkIcon = PERK_ICONS[k] || Sparkles;
                return (
                  <li
                    key={k}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <ItemAvatar icon={PerkIcon} />
                    <p className="text-sm font-medium leading-tight">
                      {PERK_LABELS[k] || k}
                    </p>
                  </li>
                );
              })}
            </ul>
          </RichSection>
        )}

        {hasCommunity && (
          <RichSection
            icon={Users}
            title="Community Access"
            subtitle="Train with people on the same journey"
            count={enabledCommunity.length}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enabledCommunity.map((k) => {
                const CommIcon = COMMUNITY_ICONS[k] || Users;
                return (
                  <li
                    key={k}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <ItemAvatar icon={CommIcon} />
                    <p className="text-sm font-medium leading-tight">
                      {COMMUNITY_LABELS[k] || k}
                    </p>
                  </li>
                );
              })}
            </ul>
          </RichSection>
        )}
      </div>

      {!hasAnySection && (
        <p className="text-center text-sm text-muted-foreground">
          This subscription does not yet have benefits configured.
        </p>
      )}
    </div>
  );
}

// ─── Rich Section ──────────────────────────────────────────────

function RichSection({
  icon: Icon,
  title,
  subtitle,
  count,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card overflow-hidden">
      {/* Banner header — black bg, red avatar with white icon */}
      <div className="flex items-center gap-4 px-6 py-5 bg-black text-white">
        <span
          className="h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: BRAND_RED }}
        >
          <Icon className="h-7 w-7 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold tracking-tight leading-tight text-white">
            {title}
          </h3>
          <p className="text-xs text-white/70 mt-0.5">{subtitle}</p>
        </div>
        <span className="shrink-0 h-7 min-w-[28px] px-2 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-sm font-semibold tabular-nums text-white">
          {count}
        </span>
      </div>

      {/* Body */}
      <div className="px-6 py-4">{children}</div>
    </section>
  );
}

function ProductsGrouped({
  rules,
}: {
  rules: SubscribeTier["redemptionRules"];
}) {
  const groups = [
    {
      key: "MEMBERS_STORE",
      label: "Members Store",
      items: rules.filter((r) => r.redemptionType === "MEMBERS_STORE"),
    },
    {
      key: "MEMBERS_RATE",
      label: "Members Rate",
      items: rules.filter((r) => r.redemptionType === "MEMBERS_RATE"),
    },
  ].filter((g) => g.items.length > 0);

  const titleCase = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

  const prettyName = (r: SubscribeTier["redemptionRules"][number]) =>
    r.scopeType === "CATEGORY" ? titleCase(r.scopeValue) : r.scopeValue;

  const describe = (r: SubscribeTier["redemptionRules"][number]) => {
    if (r.scopeType === "CATEGORY")
      return `Entire ${titleCase(r.scopeValue).toLowerCase()} catalog at member price`;
    if (r.scopeType === "SUB_CATEGORY")
      return `All items in the ${r.scopeValue} sub-category`;
    if (r.scopeType === "SKU")
      return "Single product, exclusive member pricing";
    return "Members-only price";
  };

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.key}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {group.label}
          </p>
          <ul className="divide-y divide-border">
            {group.items.map((r) => (
              <li key={r.id} className="flex items-center gap-4 py-3">
                <ItemAvatar icon={Tag} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight truncate">
                    {prettyName(r)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {describe(r)}
                  </p>
                </div>
                <DiscountBadge value={r.discountPercent} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ItemAvatar({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      className="h-10 w-10 shrink-0 rounded-lg bg-white ring-1 ring-border flex items-center justify-center"
      style={{ color: BRAND_RED }}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function DiscountBadge({ value }: { value: number }) {
  return (
    <span
      className="shrink-0 px-2.5 py-1 rounded-md text-sm font-semibold tabular-nums"
      style={{
        backgroundColor: `${BRAND_RED}1A`,
        color: BRAND_RED,
      }}
    >
      {value}% off
    </span>
  );
}

// ─── Step 2: Packages ──────────────────────────────────────────

function Step2Packages({
  packages,
  selectedId,
  expandedId,
  expanded,
  onExpand,
  onSelect,
}: {
  packages: SubscribePackage[];
  selectedId: string | null;
  expandedId: string | null;
  expanded: SubscribePackage | null;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  if (packages.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <h2 className="text-base font-semibold">No packages yet</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Packages for this subscription haven't been configured. Please contact
          support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Choose your package</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick the package that fits your goal. You can always change it later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => {
          const selected = selectedId === pkg.id;
          const isExpanded = expandedId === pkg.id;
          return (
            <article
              key={pkg.id}
              onClick={() => onExpand(pkg.id)}
              className={cn(
                "rounded-xl border bg-card overflow-hidden flex flex-col cursor-pointer transition-all",
                selected
                  ? "ring-2 ring-foreground"
                  : isExpanded
                    ? "shadow-md border-foreground/30"
                    : "hover:shadow-sm hover:border-foreground/20",
              )}
            >
              {pkg.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pkg.imageUrl}
                  alt={pkg.name}
                  className="aspect-[4/3] w-full object-cover bg-muted"
                />
              ) : (
                <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  No image
                </div>
              )}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-tight">
                    {pkg.name}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {pkg.fitnessGoal.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                </div>
                {pkg.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {pkg.description}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {pkg.products.length} product
                  {pkg.products.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="p-4 pt-0">
                <Button
                  size="sm"
                  variant={selected ? "default" : "secondary"}
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(pkg.id);
                  }}
                >
                  {selected ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Selected
                    </>
                  ) : (
                    "Select"
                  )}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Detail dialog */}
      <Dialog
        open={!!expanded}
        onOpenChange={(open) => {
          if (!open) onExpand("");
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="!max-w-[640px] w-[640px] p-0 max-h-[85vh] flex flex-col gap-0 overflow-hidden"
        >
          {expanded && (
            <>
              {/* Banner */}
              <div className="relative shrink-0">
                {expanded.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={expanded.imageUrl}
                    alt={expanded.name}
                    className="w-full aspect-[16/9] object-cover bg-muted"
                  />
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted" />
                )}
                <button
                  type="button"
                  onClick={() => onExpand("")}
                  aria-label="Close"
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors flex items-center justify-center text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Title + description */}
              <DialogHeader className="px-6 pt-5 pb-3 shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <DialogTitle className="text-xl">{expanded.name}</DialogTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {expanded.fitnessGoal.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                </div>
                {expanded.description && (
                  <DialogDescription className="mt-1 text-left">
                    {expanded.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              {/* Products list — scrolls when list overflows */}
              <div className="px-6 pb-6 min-h-0 flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 shrink-0">
                  What's in this package
                </p>
                {expanded.products.length > 0 ? (
                  <ul className="space-y-2 overflow-y-auto pr-1 -mr-1">
                    {expanded.products.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-3 rounded-md border p-3"
                      >
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-12 w-12 object-cover rounded shrink-0 bg-muted"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-tight">
                            {p.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Qty {p.quantity}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No products configured for this package.
                  </p>
                )}
              </div>

              <DialogFooter className="!mx-0 !mb-0 px-6 py-4 border-t shrink-0 rounded-b-xl">
                <Button
                  variant="outline"
                  onClick={() => onExpand("")}
                  className="sm:flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    onSelect(expanded.id);
                    onExpand("");
                  }}
                  className="sm:flex-1"
                >
                  {selectedId === expanded.id ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Selected
                    </>
                  ) : (
                    "Select this package"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Step 3: Checkout ──────────────────────────────────────────

function Step3Checkout({
  tier,
  selectedPackage,
  cycle,
  onCycleChange,
  cyclePrice,
  cycleSuffix,
  monthlyEquivalent,
  form,
  setForm,
}: {
  tier: SubscribeTier;
  selectedPackage: SubscribePackage | null;
  cycle: BillingCycle;
  onCycleChange: (c: BillingCycle) => void;
  cyclePrice: number;
  cycleSuffix: string;
  monthlyEquivalent: number;
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<{
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
  }>>;
}) {
  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const cycles: Array<{
    key: BillingCycle;
    label: string;
    badge?: string;
    price: number;
    suffix: string;
  }> = [
    {
      key: "monthly",
      label: "Monthly",
      price: tier.monthlyPrice,
      suffix: "/month",
    },
    {
      // Biannual = customer prepays 6 months upfront. The displayed price
      // is the per-month rate (with discount); the badge compares it
      // against the monthly rate × 6 months.
      key: "biannual",
      label: "Biannual",
      badge: tier.biannualDisplay
        ? `Save ${Math.round(
            ((tier.monthlyPrice * 6 - tier.biannualDisplay * 6) /
              (tier.monthlyPrice * 6)) *
              100,
          )}%`
        : undefined,
      price: tier.biannualDisplay ?? tier.biannualPrice,
      suffix: "/mo (billed every 6 months)",
    },
    {
      key: "annual",
      label: "Annual",
      badge: tier.annualDisplay
        ? `Save ${Math.round(
            ((tier.monthlyPrice * 12 - tier.annualDisplay) /
              (tier.monthlyPrice * 12)) *
              100,
          )}%`
        : undefined,
      price: tier.annualDisplay ?? tier.annualPrice,
      suffix: "/year",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: form */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer details</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in your information to complete the subscription.
          </p>
        </div>

        <section className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold">Personal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name">
              <Input
                value={form.fullName}
                onChange={update("fullName")}
                placeholder="Jane Doe"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="jane@example.com"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={update("phone")}
                placeholder="+1 (555) 000-0000"
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold">Shipping address</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Street address" className="sm:col-span-2">
              <Input
                value={form.address}
                onChange={update("address")}
                placeholder="123 Main St"
              />
            </Field>
            <Field label="City">
              <Input value={form.city} onChange={update("city")} />
            </Field>
            <Field label="State">
              <Input value={form.state} onChange={update("state")} />
            </Field>
            <Field label="ZIP / Postal code">
              <Input value={form.zip} onChange={update("zip")} />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold">Billing cycle</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {cycles.map((c) => {
              const active = cycle === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onCycleChange(c.key)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{c.label}</span>
                    {c.badge && (
                      <Badge variant="secondary" className="text-[10px]">
                        {c.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-lg font-bold tabular-nums">
                    {formatCurrency(c.price)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      {c.suffix}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold">Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Card number" className="sm:col-span-3">
              <Input
                value={form.cardNumber}
                onChange={update("cardNumber")}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
              />
            </Field>
            <Field label="Expiry">
              <Input
                value={form.cardExpiry}
                onChange={update("cardExpiry")}
                placeholder="MM / YY"
              />
            </Field>
            <Field label="CVC">
              <Input
                value={form.cardCvc}
                onChange={update("cardCvc")}
                placeholder="123"
                inputMode="numeric"
              />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Recurring billing managed by Recharge. You can cancel anytime.
          </p>
        </section>
      </div>

      {/* Right: order summary */}
      <aside className="lg:sticky lg:top-6 h-fit space-y-4">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="text-sm font-semibold">Order summary</h3>
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-md flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: tier.colorAccent }}
            >
              {tier.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-tight">{tier.name}</p>
              <p className="text-xs text-muted-foreground leading-tight">
                Subscription · {cycle}
              </p>
            </div>
          </div>

          {selectedPackage && (
            <div className="pt-2 border-t">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Package
              </p>
              <p className="text-sm font-medium">{selectedPackage.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedPackage.products.length} products
              </p>
            </div>
          )}

          <div className="pt-2 border-t space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(cyclePrice)}</span>
            </div>
            {cycle !== "monthly" && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Equivalent</span>
                <span className="tabular-nums">
                  {formatCurrency(monthlyEquivalent)}/mo
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t flex items-baseline justify-between">
            <span className="text-sm font-semibold">Total today</span>
            <span className="text-xl font-bold tabular-nums">
              {formatCurrency(cyclePrice)}
              <span className="text-xs font-normal text-muted-foreground ml-1">
                {cycleSuffix}
              </span>
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

// ─── Step 4: Thank You ─────────────────────────────────────────

function Step4ThankYou({ tier }: { tier: SubscribeTier }) {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-6">
      <div className="h-20 w-20 rounded-full bg-[#C5F135] flex items-center justify-center">
        <PartyPopper className="h-10 w-10 text-black" />
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to {tier.name}!
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          Your subscription is active. We've sent a confirmation email with your
          order details and what comes next.
        </p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()}>
        Start over
      </Button>
    </div>
  );
}
