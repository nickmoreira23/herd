import { ModelsList } from "@/components/financials/models-list";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function ProjectionsPage() {
  const locale = await getLocale();
  return <ModelsList locale={locale} />;
}
