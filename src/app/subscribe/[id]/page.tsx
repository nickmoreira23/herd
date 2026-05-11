import { notFound } from "next/navigation";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { getLocale } from "@/lib/i18n/get-locale";
import { SubscriptionWizard } from "@/components/subscribe/subscription-wizard";

export default async function SubscribePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const locale = await getLocale();
  const { id } = await params;

  const tier = await prisma.subscriptionTier.findUnique({
    where: { id },
    include: {
      redemptionRules: true,
      agentAccess: {
        where: { isEnabled: true },
        include: {
          agent: { select: { id: true, name: true, category: true, icon: true } },
        },
      },
      partnerAssignments: {
        where: { isActive: true },
        include: {
          partner: { select: { id: true, name: true, logoUrl: true } },
        },
      },
    },
  });
  if (!tier) notFound();

  const settings = await prisma.setting.findMany({
    where: { key: { in: ["companyName", "companyIconUrl"] } },
  });
  const settingsMap = Object.fromEntries(settings.map((s) => [s.key, String(s.value)]));
  const companyName = settingsMap["companyName"] || "HERD";
  const companyIconUrl = settingsMap["companyIconUrl"] || null;

  // Real packages tied to this subscription tier, ordered as they appear in
  // the Packages tool. Status filter is intentionally relaxed for the
  // prototype so DRAFT packages still surface; tighten to ACTIVE only when
  // we go live.
  const variants = await prisma.packageTierVariant.findMany({
    where: {
      subscriptionTierId: id,
      package: { status: { not: "ARCHIVED" } },
    },
    include: {
      package: true,
      products: {
        orderBy: { sortOrder: "asc" },
        include: {
          product: { select: { id: true, name: true, imageUrl: true } },
        },
      },
    },
    orderBy: [
      { package: { sortOrder: "asc" } },
      { package: { name: "asc" } },
    ],
  });

  const tierData = {
    id: tier.id,
    name: tier.name,
    tagline: tier.tagline,
    description: tier.description,
    iconUrl: tier.iconUrl,
    colorAccent: tier.colorAccent,
    highlightFeatures: tier.highlightFeatures,
    monthlyPrice: toNumber(tier.monthlyPrice),
    biannualPrice: toNumber(tier.biannualPrice),
    annualPrice: toNumber(tier.annualPrice),
    biannualDisplay: tier.biannualDisplay ? toNumber(tier.biannualDisplay) : null,
    annualDisplay: tier.annualDisplay ? toNumber(tier.annualDisplay) : null,
    monthlyCredits: toNumber(tier.monthlyCredits),
    annualBonusCredits: toNumber(tier.annualBonusCredits),
    redemptionRules: tier.redemptionRules.map((r) => ({
      id: r.id,
      redemptionType: r.redemptionType,
      scopeType: r.scopeType,
      scopeValue: r.scopeValue,
      discountPercent: toNumber(r.discountPercent),
    })),
    agents: tier.agentAccess.map((a) => ({
      id: a.agent.id,
      name: a.agent.name,
      category: a.agent.category,
      icon: a.agent.icon,
    })),
    partners: tier.partnerAssignments.map((a) => ({
      id: a.partner.id,
      name: a.partner.name,
      logoUrl: a.partner.logoUrl,
      discountPercent: toNumber(a.discountPercent),
    })),
    perksConfig: (tier.perksConfig as Record<string, { enabled: boolean }>) || {},
    communityConfig: (tier.communityConfig as Record<string, boolean>) || {},
  };

  const packages = variants.map((v) => ({
    id: v.package.id,
    variantId: v.id,
    name: v.package.name,
    slug: v.package.slug,
    fitnessGoal: v.package.fitnessGoal,
    description: v.package.description,
    imageUrl: v.package.imageUrl,
    isComplete: v.isComplete,
    creditsUsed: toNumber(v.totalCreditsUsed),
    products: v.products.map((p) => ({
      id: p.product.id,
      name: p.product.name,
      imageUrl: p.product.imageUrl,
      quantity: p.quantity,
    })),
  }));

  return (
    <SubscriptionWizard
      tier={tierData}
      packages={packages}
      brand={{ name: companyName, iconUrl: companyIconUrl }}
      locale={locale}
    />
  );
}
