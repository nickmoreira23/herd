import { prisma } from "@/lib/prisma"
import { RoleForm } from "@/components/network/roles/role-form"
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";

export default async function NewRolePage() {
  await connection();
  const locale = await getLocale();
  const roles = await prisma.networkRole.findMany({
    select: { id: true, displayName: true, slug: true },
    orderBy: { displayName: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("network.roles.new.title", locale)}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("network.roles.new.description", locale)}</p>
      </div>
      <RoleForm mode="create" availableParentRoles={roles} />
    </div>
  )
}
