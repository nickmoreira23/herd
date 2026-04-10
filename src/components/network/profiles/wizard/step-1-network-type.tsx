"use client"

import * as React from "react"
import { Building2, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useWizardStore, type ProfileTypeConfig } from "@/stores/wizard-store"

interface StepNetworkTypeProps {
  onNext: () => void
}

export function StepNetworkType({ onNext }: StepNetworkTypeProps) {
  const { formData, updateFormData, setProfileTypeConfig } = useWizardStore()
  const [profileTypes, setProfileTypes] = React.useState<ProfileTypeConfig[]>([])
  const [loadingTypes, setLoadingTypes] = React.useState(false)

  const selectedNetwork = formData.networkType
  const selectedTypeId = formData.profileTypeId

  // Load profile types when network type changes
  React.useEffect(() => {
    if (!selectedNetwork) return
    setLoadingTypes(true)
    fetch(`/api/network/profile-types?network_type=${selectedNetwork}&is_active=true`)
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setProfileTypes(json.data)
      })
      .finally(() => setLoadingTypes(false))
  }, [selectedNetwork])

  function handleNetworkSelect(nt: "INTERNAL" | "EXTERNAL") {
    updateFormData({ networkType: nt, profileTypeId: undefined })
    setProfileTypes([])
  }

  function handleTypeSelect(pt: ProfileTypeConfig) {
    updateFormData({ profileTypeId: pt.id })
    setProfileTypeConfig(pt)
  }

  const canProceed = !!selectedNetwork && !!selectedTypeId

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Network Type</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select which network this profile belongs to.
        </p>
      </div>

      {/* Network cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            value: "INTERNAL" as const,
            label: "Internal",
            description: "Employees, managers, and sales staff",
            icon: Building2,
          },
          {
            value: "EXTERNAL" as const,
            label: "External",
            description: "Promoters, influencers, trainers, and partners",
            icon: Globe,
          },
        ].map(({ value, label, description, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleNetworkSelect(value)}
            className={cn(
              "flex flex-col items-start gap-3 p-5 rounded-xl border-2 text-left transition-all",
              selectedNetwork === value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-foreground/30"
            )}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                selectedNetwork === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <Badge variant={value === "INTERNAL" ? "secondary" : "default"} className="mb-1">
                {value}
              </Badge>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Profile type grid */}
      {selectedNetwork && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            Select Profile Type{" "}
            <span className="text-muted-foreground font-normal">for {selectedNetwork.toLowerCase()} network</span>
          </h3>

          {loadingTypes ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {profileTypes.map((pt) => (
                <button
                  key={pt.id}
                  type="button"
                  onClick={() => handleTypeSelect(pt)}
                  className={cn(
                    "flex flex-col items-start gap-1 p-4 rounded-lg border text-left transition-all",
                    selectedTypeId === pt.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-foreground/30"
                  )}
                >
                  <span className="text-sm font-medium">{pt.displayName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            canProceed
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
