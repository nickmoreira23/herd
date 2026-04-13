import { FinancialPageClient } from "@/components/financials/financial-page-client";
import { getFinancialDefaults } from "../data";

export default async function NewModelPage() {
  const { tierData, commissionData, salesRepData, partnerData, overheadData, opexData } =
    await getFinancialDefaults();

  return (
    <FinancialPageClient
      tierData={tierData}
      commissionData={commissionData}
      salesRepData={salesRepData}
      partnerData={partnerData}
      overheadData={overheadData}
      opexData={opexData}
    />
  );
}
