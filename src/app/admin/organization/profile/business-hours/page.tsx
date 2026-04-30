import { prisma } from "@/lib/prisma";
import { BusinessHoursForm } from "@/components/organization/business-hours-form";
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function BusinessHoursPage() {
  await connection();
  const locale = await getLocale();
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = String(s.value ?? "");
  }

  return <BusinessHoursForm initialSettings={map} locale={locale} />;
}
