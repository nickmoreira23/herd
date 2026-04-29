import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FinancialPageClient } from "@/components/financials/financial-page-client";
import { getFinancialDefaults } from "../../data";
import type { FinancialInputs } from "@/lib/financial-engine";
import { connection } from "next/server";

export default async function EditProjectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
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
      partnerData={defaults.partnerData}
      overheadData={defaults.overheadData}
      opexData={defaults.opexData}
      productCOGSRatio={defaults.productCOGSRatio}
      productFulfillmentCost={defaults.productFulfillmentCost}
      productShippingCost={defaults.productShippingCost}
      fullyLoadedCommissionData={defaults.fullyLoadedCommissionData}
      dataSourceMeta={defaults.dataSourceMeta}
      tierDisplayMeta={defaults.tierDisplayMeta}
      modelId={snapshot.id}
      initialName={snapshot.scenarioName || ""}
      initialColor={snapshot.color || "#3B82F6"}
      initialInputs={snapshot.assumptions as unknown as FinancialInputs}
    />
  );
}
