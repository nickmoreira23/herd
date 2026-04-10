import { prisma } from "@/lib/prisma";
import { BusinessHoursForm } from "@/components/organization/business-hours-form";

export default async function BusinessHoursPage() {
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = String(s.value ?? "");
  }

  return <BusinessHoursForm initialSettings={map} />;
}
