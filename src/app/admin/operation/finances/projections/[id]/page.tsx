import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FinancialPageClient } from "@/components/financials/financial-page-client";
import { getFinancialDefaults } from "../../data";
import type { FinancialInputs } from "@/lib/financial-engine";

export default async function EditProjectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "new") return notFound();

  const [snapshot, defaults] = await Promise.all([
    prisma.financialSnapshot.findUnique({ where: { id } }),
    getFinancialDefaults(),
  ]);

  if (!snapshot) return notFound();

  return (
    <FinancialPageClient
      tierData={defaults.tierData}
      commissionData={defaults.commissionData}
      salesRepData={defaults.salesRepData}
      samplerData={defaults.samplerData}
      partnerData={defaults.partnerData}
      overheadData={defaults.overheadData}
      opexData={defaults.opexData}
      modelId={snapshot.id}
      initialName={snapshot.scenarioName || ""}
      initialColor={snapshot.color || "#3B82F6"}
      initialInputs={snapshot.assumptions as unknown as FinancialInputs}
    />
  );
}
