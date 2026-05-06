import { FinancialPageClient } from "@/components/financials/financial-page-client";
import { getFinancialDefaults } from "../data";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function NewModelPage() {
  const [defaults, locale] = await Promise.all([
    getFinancialDefaults(),
    getLocale(),
  ]);
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
    packagesCatalog,
  } = defaults;

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
      packagesCatalog={packagesCatalog}
      locale={locale}
    />
  );
}
