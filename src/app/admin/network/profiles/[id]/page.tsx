import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection();
  const locale = await getLocale();
  const { id } = await params

  const profile = await prisma.networkProfile.findUnique({
    where: { id },
    include: {
      profileType: true,
      parent: { select: { id: true, firstName: true, lastName: true, email: true } },
      profileRoles: { include: { role: { select: { id: true, displayName: true, slug: true } } } },
      profileRanks: {
        where: { isCurrent: true },
        include: { rankTier: true },
        take: 1,
      },
      attributes: true,
      compensations: {
        where: { effectiveTo: null },
        include: { compPlan: { select: { id: true, name: true } } },
        take: 1,
      },
      teamMemberships: { include: { team: { select: { id: true, name: true } } } },
    },
  })

  if (!profile) notFound()

  const currentRank = profile.profileRanks[0]?.rankTier
  const currentComp = profile.compensations[0]?.compPlan
  const fullName = `${profile.firstName} ${profile.lastName}`
  const parentFullName = profile.parent ? `${profile.parent.firstName} ${profile.parent.lastName}` : ""

  const statusVariantMap: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
    active: "default",
    pending: "outline",
    suspended: "secondary",
    terminated: "destructive",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
        </div>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          {t("network.profiles.detail.edit_button", locale)}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identity card */}
          <div className="rounded-xl border border-border p-5">
            <div className="flex items-center gap-4 mb-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                  style={{ backgroundColor: profile.profileType?.color ?? "#6366f1" }}
                >
                  {profile.firstName[0]}
                  {profile.lastName[0]}
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold">{fullName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={profile.networkType === "INTERNAL" ? "secondary" : "default"}>
                    {profile.networkType}
                  </Badge>
                  {profile.profileType && (
                    <Badge variant="outline">{profile.profileType.displayName}</Badge>
                  )}
                  <Badge variant={statusVariantMap[profile.status.toLowerCase()] ?? "outline"}>
                    {profile.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs mb-0.5">{t("network.profiles.detail.email_label", locale)}</p>
                <p>{profile.email}</p>
              </div>
              {profile.phone && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">{t("network.profiles.detail.phone_label", locale)}</p>
                  <p>{profile.phone}</p>
                </div>
              )}
              {profile.parent && (
                <div>
                  <p className="text-muted-foreground text-xs mb-0.5">{t("network.profiles.detail.supervisor_label", locale)}</p>
                  <Link
                    href={`/admin/network/profiles/${profile.parent.id}`}
                    className="hover:underline"
                  >
                    {parentFullName}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Attributes */}
          {profile.attributes.length > 0 && (
            <div className="rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-3">{t("network.profiles.detail.additional_information", locale)}</h3>
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                {profile.attributes.map((attr) => (
                  <div key={attr.id}>
                    <p className="text-muted-foreground text-xs mb-0.5 capitalize">
                      {attr.attributeKey.replace(/_/g, " ")}
                    </p>
                    <p>
                      {Array.isArray(attr.attributeValue)
                        ? (attr.attributeValue as string[]).join(", ")
                        : String(attr.attributeValue)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Roles */}
          <div className="rounded-xl border border-border p-4">
            <h3 className="font-semibold text-sm mb-3">{t("network.profiles.detail.roles_title", locale)}</h3>
            {profile.profileRoles.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("network.profiles.detail.no_roles", locale)}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {profile.profileRoles.map((pr) => (
                  <Link
                    key={pr.roleId}
                    href={`/admin/network/roles/${pr.roleId}`}
                    className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium hover:bg-muted/80 transition-colors"
                  >
                    {pr.role.displayName}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Rank (external) */}
          {profile.networkType === "EXTERNAL" && (
            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">{t("network.profiles.detail.rank_title", locale)}</h3>
              {currentRank ? (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentRank.color ?? undefined }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: currentRank.color ?? undefined }}
                  >
                    {currentRank.displayName}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("network.profiles.detail.no_rank", locale)}</p>
              )}
            </div>
          )}

          {/* Compensation (external) */}
          {profile.networkType === "EXTERNAL" && (
            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">{t("network.profiles.detail.compensation_title", locale)}</h3>
              {currentComp ? (
                <p className="text-sm">{currentComp.name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("network.profiles.detail.no_plan", locale)}</p>
              )}
            </div>
          )}

          {/* Teams */}
          {profile.teamMemberships.length > 0 && (
            <div className="rounded-xl border border-border p-4">
              <h3 className="font-semibold text-sm mb-3">{t("network.profiles.detail.teams_title", locale)}</h3>
              <div className="space-y-1">
                {profile.teamMemberships.map((tm) => (
                  <p key={tm.teamId} className="text-sm">
                    {tm.team.name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
