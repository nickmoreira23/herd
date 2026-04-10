import { prisma } from "@/lib/prisma";
import { RegionalSettingsForm } from "@/components/organization/regional-settings-form";

export default async function RegionalSettingsPage() {
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });

  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = String(s.value ?? "");
  }

  return <RegionalSettingsForm initialSettings={map} />;
}
