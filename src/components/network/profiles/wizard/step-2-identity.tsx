"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWizardStore } from "@/stores/wizard-store"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface StepIdentityProps {
  onNext: () => void
  onBack: () => void
}

export function StepIdentity({ onNext, onBack }: StepIdentityProps) {
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
        <h2 className="text-xl font-semibold">Identity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Basic information for this profile.
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        {/* Name */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">First Name *</label>
            <Input
              value={formData.firstName ?? ""}
              onChange={(e) => updateFormData({ firstName: e.target.value })}
              placeholder="Jane"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Last Name *</label>
            <Input
              value={formData.lastName ?? ""}
              onChange={(e) => updateFormData({ lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email Address *</label>
          <div className="relative">
            <Input
              type="email"
              value={formData.email ?? ""}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="jane@example.com"
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
              This email is already registered in the network.
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Phone Number</label>
          <Input
            type="tel"
            value={formData.phone ?? ""}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {/* Avatar */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Profile Photo</label>
          <div className="flex items-center gap-4">
            {formData.avatarUrl && (
              <img
                src={formData.avatarUrl}
                alt="Avatar preview"
                className="w-12 h-12 rounded-full object-cover border border-border"
              />
            )}
            <label className="cursor-pointer">
              <span className="inline-flex items-center px-3 py-2 rounded-md border border-border text-sm hover:bg-muted transition-colors">
                {formData.avatarUrl ? "Change Photo" : "Upload Photo"}
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
                Remove
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            PNG, JPG up to 2MB. Stored locally for now.
          </p>
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
          disabled={!isValid}
          className={cn(
            "px-6 py-2 rounded-lg text-sm font-medium transition-all",
            isValid
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
