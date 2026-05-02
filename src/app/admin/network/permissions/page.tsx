import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";

export default async function PermissionsPage() {
  await connection();
  const locale = await getLocale();
  const permissions = await prisma.networkPermission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  })

  type PermRow = (typeof permissions)[number]
  const grouped = permissions.reduce<Record<string, PermRow[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = []
    acc[p.resource].push(p)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("network.permissions.page.title", locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("network.permissions.page.description", locale)}</p>
      </div>
      <div className="space-y-4">
        {Object.entries(grouped).map(([resource, perms]) => (
          <div key={resource} className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize">{resource}</h3>
              <span className="text-xs text-muted-foreground">{t("network.permissions.page.actions_count", locale, { count: perms.length })}</span>
            </div>
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {perms.map((p) => {
                const label = `${resource}:${p.action}`;
                return (
                  <Badge key={p.id} variant="outline" className="font-mono text-xs">
                    {label}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
