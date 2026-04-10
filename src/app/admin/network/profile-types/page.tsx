import Link from "next/link"
import { Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ProfileTypeTable } from "@/components/network/profile-types/profile-type-table"
import { connection } from "next/server";

export default async function ProfileTypesPage() {
  await connection();
  const profileTypes = await prisma.networkProfileType.findMany({
    include: {
      _count: { select: { profiles: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
  })

  const data = profileTypes.map((pt) => ({
    ...pt,
    wizardFields: pt.wizardFields as unknown[],
    canDelete: pt._count.profiles === 0,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile Types</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure the types of profiles in your network and their wizard fields.</p>
        </div>
        <Link
          href="/admin/network/profile-types/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Profile Type
        </Link>
      </div>
      <ProfileTypeTable data={data} />
    </div>
  )
}
