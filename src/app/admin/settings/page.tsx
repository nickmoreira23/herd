import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/settings-form";
import { connection } from "next/server";

export default async function SettingsPage() {
  await connection();
  const settings = await prisma.setting.findMany({
    orderBy: { key: "asc" },
  });

  const settingsMap: Record<string, string> = {};
  for (const s of settings) {
    settingsMap[s.key] = String(s.value ?? "");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          System-wide configuration values that feed into calculations across the platform.
        </p>
      </div>
      <SettingsForm initialSettings={settingsMap} />
    </div>
  );
}
