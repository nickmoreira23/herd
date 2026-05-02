import { LocationsForm } from "@/components/organization/locations-form";
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function LocationsPage() {
  await connection();
  const locale = await getLocale();
  return <LocationsForm locale={locale} />;
}
