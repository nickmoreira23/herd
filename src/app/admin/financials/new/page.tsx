import { FinancialPageClient } from "@/components/financials/financial-page-client";
import { getFinancialDefaults } from "../data";

export default async function NewModelPage() {
  const { tierData, commissionData, salesRepData, samplerData, partnerData, overheadData, opexData } =
    await getFinancialDefaults();

  return (
    <FinancialPageClient
      tierData={tierData}
      commissionData={commissionData}
      salesRepData={salesRepData}
      samplerData={samplerData}
      partnerData={partnerData}
      overheadData={overheadData}
      opexData={opexData}
    />
  );
}
