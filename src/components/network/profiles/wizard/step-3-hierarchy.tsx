"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWizardStore } from "@/stores/wizard-store"
import { Search, X } from "lucide-react"

interface ProfileOption {
  id: string
  firstName: string
  lastName: string
  email: string
  profileType?: { displayName: string } | null
}

interface TeamOption {
  id: string
  name: string
  _count: { members: number }
}

interface StepHierarchyProps {
  onNext: () => void
  onBack: () => void
}

export function StepHierarchy({ onNext, onBack }: StepHierarchyProps) {
  const { formData, updateFormData } = useWizardStore()

  const [parentSearch, setParentSearch] = React.useState("")
  const [parentResults, setParentResults] = React.useState<ProfileOption[]>([])
  const [parentLoading, setParentLoading] = React.useState(false)
  const [selectedParent, setSelectedParent] = React.useState<ProfileOption | null>(null)

  const [teams, setTeams] = React.useState<TeamOption[]>([])
  const [selectedTeamIds, setSelectedTeamIds] = React.useState<string[]>(
    formData.teamIds ?? []
  )

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load teams on mount
  React.useEffect(() => {
    fetch("/api/network/teams")
      .then((r) => r.json())
      .then((json) => json.data && setTeams(json.data))
  }, [])

  // Debounced parent search
  React.useEffect(() => {
    if (!parentSearch.trim()) {
      setParentResults([])
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setParentLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/network/profiles?search=${encodeURIComponent(parentSearch)}&limit=10`
        )
        const json = await res.json()
        setParentResults(json.data?.profiles ?? [])
      } finally {
        setParentLoading(false)
      }
    }, 400)
  }, [parentSearch])

  function selectParent(profile: ProfileOption) {
    setSelectedParent(profile)
    setParentSearch("")
    setParentResults([])
    updateFormData({ parentId: profile.id })
  }

  function clearParent() {
    setSelectedParent(null)
    updateFormData({ parentId: undefined })
  }

  function toggleTeam(teamId: string) {
    const next = selectedTeamIds.includes(teamId)
      ? selectedTeamIds.filter((id) => id !== teamId)
      : [...selectedTeamIds, teamId]
    setSelectedTeamIds(next)
    updateFormData({ teamIds: next })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Hierarchy Placement</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Set the supervisor and team assignments for this profile.
        </p>
      </div>

      <div className="space-y-5 max-w-lg">
        {/* Parent / supervisor */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Supervisor / Upline{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>

          {selectedParent ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {selectedParent.firstName} {selectedParent.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedParent.email}
                  {selectedParent.profileType &&
                    ` - ${selectedParent.profileType.displayName}`}
                </p>
              </div>
              <button
                type="button"
                onClick={clearParent}
                className="p-1 rounded hover:bg-background transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9"
              />
              {parentResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                  {parentResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectParent(p)}
                      className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {parentLoading && (
                <p className="text-xs text-muted-foreground mt-1 pl-1">Searching...</p>
              )}
            </div>
          )}
        </div>

        {/* Team assignment */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Team Assignments{" "}
            <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teams created yet.</p>
          ) : (
            <div className="space-y-1.5">
              {teams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                    className="rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">{team.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {team._count.members} members
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
