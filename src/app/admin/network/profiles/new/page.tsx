import { WizardShell } from "@/components/network/profiles/wizard/wizard-shell"

export default function NewProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Add Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Create a new internal or external network member.</p>
      </div>
      <WizardShell />
    </div>
  )
}
