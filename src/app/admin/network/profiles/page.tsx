import Link from "next/link"
import { Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ProfileTable } from "@/components/network/profiles/profile-table"
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";

export default async function ProfilesPage() {
  await connection();
  const locale = await getLocale();
  const profiles = await prisma.networkProfile.findMany({
    include: {
      profileType: { select: { id: true, displayName: true, color: true } },
      profileRanks: {
        where: { isCurrent: true },
        include: { rankTier: { select: { displayName: true, color: true, level: true } } },
        take: 1,
      },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  })

  const descriptionKey = profiles.length === 1
    ? "network.profiles.list.description_one"
    : "network.profiles.list.description_other";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("network.profiles.list.title", locale)}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t(descriptionKey, locale, { count: profiles.length })}</p>
        </div>
        <Link
          href="/admin/network/profiles/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("network.profiles.list.add_button", locale)}
        </Link>
      </div>
      <ProfileTable data={profiles} />
    </div>
  )
}
