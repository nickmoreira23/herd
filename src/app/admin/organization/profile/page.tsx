import { prisma } from "@/lib/prisma";
import { GeneralInformationForm } from "@/components/organization/general-information-form";

export default async function GeneralInformationPage() {
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = String(s.value ?? "");
  }

  return <GeneralInformationForm initialSettings={map} />;
}
