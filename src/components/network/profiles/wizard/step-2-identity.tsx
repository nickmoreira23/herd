"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWizardStore } from "@/stores/wizard-store"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { useT } from "@/lib/i18n/locale-context"

interface StepIdentityProps {
  onNext: () => void
  onBack: () => void
}

export function StepIdentity({ onNext, onBack }: StepIdentityProps) {
  const t = useT()
  const { formData, updateFormData } = useWizardStore()
  const [emailStatus, setEmailStatus] = React.useState<
    "idle" | "checking" | "available" | "taken"
  >("idle")
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const isValid =
    !!formData.firstName &&
    !!formData.lastName &&
    !!formData.email &&
    emailStatus !== "taken" &&
    emailStatus !== "checking"

  function handleEmailChange(email: string) {
    updateFormData({ email })
    setEmailStatus("idle")

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!email) return

    setEmailStatus("checking")
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/network/profiles?check_email=${encodeURIComponent(email)}`
        )
        const json = await res.json()
        setEmailStatus(json.data?.exists ? "taken" : "available")
      } catch {
        setEmailStatus("idle")
      }
    }, 500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("network.wizard.step2.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("network.wizard.step2.description")}
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("network.wizard.step2.first_name_label")}
            </label>
            <Input
              value={formData.firstName ?? ""}
              onChange={(e) => updateFormData({ firstName: e.target.value })}
              placeholder={t("network.wizard.step2.first_name_placeholder")}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t("network.wizard.step2.last_name_label")}
            </label>
            <Input
              value={formData.lastName ?? ""}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
              placeholder={t("network.wizard.step2.last_name_placeholder")}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {t("network.wizard.step2.email_label")}
          </label>
          <div className="relative">
            <Input
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder={t("network.wizard.step2.email_placeholder")}
              required
              className={cn(
                "pr-10",
                emailStatus === "taken" && "border-destructive"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {emailStatus === "checking" && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              {emailStatus === "available" && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
              {emailStatus === "taken" && (
                <XCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
          </div>
          {emailStatus === "taken" && (
            <p className="text-xs text-destructive">
              {t("network.wizard.step2.email_taken")}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {t("network.wizard.step2.phone_label")}
          </label>
          <Input
            type="tel"
            value={formData.phone ?? ""}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder={t("network.wizard.step2.phone_placeholder")}
          />
        </div>

        {/* Avatar */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {t("network.wizard.step2.avatar_label")}
          </label>
          <div className="flex items-center gap-4">
            {formData.avatarUrl && (
              <img
                src={formData.avatarUrl}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-border"
              />
            )}
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-3 py-2 rounded-md border border-border text-sm hover:bg-muted transition-colors">
                {formData.avatarUrl
                  ? t("network.wizard.step2.avatar_change")
                  : t("network.wizard.step2.avatar_upload")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    updateFormData({ avatarUrl: ev.target?.result as string })
                  }
                  reader.readAsDataURL(file)
                }}
              />
            </label>
            {formData.avatarUrl && (
              <button
                type="button"
                onClick={() => updateFormData({ avatarUrl: undefined })}
                className="text-xs text-destructive hover:underline"
              >
                {t("network.wizard.step2.avatar_remove")}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("network.wizard.step2.avatar_hint")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors"
        >
          {t("network.wizard.common.back")}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!isValid}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            isValid
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
