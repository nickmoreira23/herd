import Link from "next/link"
import { Plus } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { ProfileTable } from "@/components/network/profiles/profile-table"
import { connection } from "next/server";

export default async function ProfilesPage() {
  await connection();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profiles</h1>
          <p className="text-sm text-muted-foreground mt-1">{`${profiles.length} profile${profiles.length !== 1 ? "s" : ""} in the network`}</p>
        </div>
        <Link
          href="/admin/network/profiles/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Profile
        </Link>
      </div>
      <ProfileTable data={profiles} />
    </div>
  )
}
