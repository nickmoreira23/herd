import { prisma } from "@/lib/prisma"
import { Badge } from "@/components/ui/badge"

export default async function PermissionsPage() {
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
        <h1 className="text-2xl font-bold">Permissions</h1>
        <p className="text-sm text-muted-foreground mt-1">System permissions. Assign them to roles in the Roles section.</p>
      </div>
      <div className="space-y-4">
        {Object.entries(grouped).map(([resource, perms]) => (
          <div key={resource} className="rounded-lg border border-border overflow-hidden">
            <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between">
              <h3 className="text-sm font-semibold capitalize">{resource}</h3>
              <span className="text-xs text-muted-foreground">{perms.length} actions</span>
            </div>
            <div className="flex flex-wrap gap-2 px-4 py-3">
              {perms.map((p) => (
                <Badge key={p.id} variant="outline" className="font-mono text-xs">
                  {resource}:{p.action}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
