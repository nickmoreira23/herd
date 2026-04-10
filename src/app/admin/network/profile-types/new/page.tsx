import { ProfileTypeForm } from "@/components/network/profile-types/profile-type-form"

export default function NewProfileTypePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Profile Type</h1>
        <p className="text-sm text-muted-foreground mt-1">Define a new profile category with custom wizard fields.</p>
      </div>
      <ProfileTypeForm mode="create" />
    </div>
  )
}
