import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileTypeForm } from "@/components/network/profile-types/profile-type-form"
import type { WizardField } from "@/lib/validations/network"
import { connection } from "next/server";

export default async function EditProfileTypePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await connection();
  const { id } = await params

  const profileType = await prisma.networkProfileType.findUnique({ where: { id } })
  if (!profileType) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{`Edit: ${profileType.displayName}`}</h1>
        <p className="text-sm text-muted-foreground mt-1">Modify profile type settings and wizard fields.</p>
      </div>
      <ProfileTypeForm
        mode="edit"
        profileTypeId={id}
        defaultValues={{
          displayName: profileType.displayName,
          slug: profileType.slug,
          description: profileType.description ?? undefined,
          networkType: profileType.networkType,
          icon: profileType.icon ?? undefined,
          color: profileType.color ?? undefined,
          wizardFields: (profileType.wizardFields as WizardField[]) ?? [],
          defaultRoleIds: profileType.defaultRoleIds,
          isActive: profileType.isActive,
          sortOrder: profileType.sortOrder,
          defaultCompPlanId: profileType.defaultCompPlanId ?? undefined,
          defaultRankId: profileType.defaultRankId ?? undefined,
        }}
      />
    </div>
  )
}
