import { FinancialPageClient } from "@/components/financials/financial-page-client";
import { getFinancialDefaults } from "../../data";

export default async function NewProjectionPage() {
  const {
    tierData,
    commissionData,
    salesRepData,
    partnerData,
    overheadData,
    opexData,
    productCOGSRatio,
    productFulfillmentCost,
    productShippingCost,
    fullyLoadedCommissionData,
    dataSourceMeta,
    tierDisplayMeta,
  } = await getFinancialDefaults();

  return (
    <FinancialPageClient
      tierData={tierData}
      commissionData={commissionData}
      salesRepData={salesRepData}
      partnerData={partnerData}
      overheadData={overheadData}
      opexData={opexData}
      productCOGSRatio={productCOGSRatio}
      productFulfillmentCost={productFulfillmentCost}
      productShippingCost={productShippingCost}
      fullyLoadedCommissionData={fullyLoadedCommissionData}
      dataSourceMeta={dataSourceMeta}
      tierDisplayMeta={tierDisplayMeta}
    />
  );
}
