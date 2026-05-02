import { WizardShell } from "@/components/network/profiles/wizard/wizard-shell"
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";

export default async function NewProfilePage() {
  await connection();
  const locale = await getLocale();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("network.profiles.new.title", locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("network.profiles.new.description", locale)}</p>
      </div>
      <WizardShell />
    </div>
  )
}
