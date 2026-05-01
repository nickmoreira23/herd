"use client"

import * as React from "react"
import { Building2, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useWizardStore, type ProfileTypeConfig } from "@/stores/wizard-store"
import { useT } from "@/lib/i18n/locale-context"
import type { MessageKey } from "@/lib/i18n/messages/pt-BR"

interface StepNetworkTypeProps {
  onNext: () => void
}

const NETWORK_TYPE_KEYS = {
  INTERNAL: "network.type.INTERNAL",
  EXTERNAL: "network.type.EXTERNAL",
} as const satisfies Record<"INTERNAL" | "EXTERNAL", MessageKey>

const NETWORK_FOR_KEYS = {
  INTERNAL: "network.wizard.step1.for_network_internal",
  EXTERNAL: "network.wizard.step1.for_network_external",
} as const satisfies Record<"INTERNAL" | "EXTERNAL", MessageKey>

export function StepNetworkType({ onNext }: StepNetworkTypeProps) {
  const t = useT()
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
        <h2 className="text-xl font-semibold">{t("network.wizard.step1.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("network.wizard.step1.description")}
        </p>
      </div>

      {/* Network cards */}
      <div className="grid grid-cols-2 gap-4">
        {[
          {
            value: "INTERNAL" as const,
            labelKey: "network.wizard.step1.internal_label" as const,
            descriptionKey: "network.wizard.step1.internal_description" as const,
            icon: Building2,
          },
          {
            value: "EXTERNAL" as const,
            labelKey: "network.wizard.step1.external_label" as const,
            descriptionKey: "network.wizard.step1.external_description" as const,
            icon: Globe,
          },
        ].map(({ value, descriptionKey, icon: Icon }) => (
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
                {t(NETWORK_TYPE_KEYS[value])}
              </Badge>
              <p className="text-sm text-muted-foreground">{t(descriptionKey)}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Profile type grid */}
      {selectedNetwork && (
        <div>
          <h3 className="text-sm font-medium mb-3">
            {t("network.wizard.step1.select_profile_type")}{" "}
            <span className="text-muted-foreground font-normal">
              {t(NETWORK_FOR_KEYS[selectedNetwork])}
            </span>
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
          {t("network.wizard.common.next")}
        </button>
      </div>
    </div>
  )
}
