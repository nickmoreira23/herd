"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Shield } from "lucide-react";
import { InfoTip } from "../info-tip";
import type { TierFormState } from "../tier-detail-client";

interface AccessTabProps {
  form: TierFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

export function AccessTab({ form, updateForm, onBlurSave }: AccessTabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Access Controls */}
      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">Access Controls</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Max Members <InfoTip text="Maximum number of subscribers allowed on this plan at once. Leave empty for unlimited." /></Label>
            <Input
              type="number"
              value={form.maxMembers}
              onChange={(e) => updateForm("maxMembers", e.target.value)}
              onBlur={onBlurSave}
              placeholder="Unlimited"
            />
            <p className="text-[10px] text-muted-foreground">Leave empty for unlimited</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Minimum Age <InfoTip text="Minimum age required to subscribe to this plan. Leave empty for no age restriction." /></Label>
            <Input
              type="number"
              value={form.minimumAge}
              onChange={(e) => updateForm("minimumAge", e.target.value)}
              onBlur={onBlurSave}
              placeholder="None"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <Switch
              checked={form.inviteOnly}
              onCheckedChange={(val) => {
                updateForm("inviteOnly", val);
                onBlurSave?.();
              }}
            />
            <div>
              <span className="text-sm font-medium">Invite Only <InfoTip text="When enabled, new members can only join this plan with a valid invitation code. Useful for exclusive or beta plans." /></span>
              <p className="text-[10px] text-muted-foreground">Requires an invitation code to join</p>
            </div>
          </label>
          <label className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <Switch
              checked={form.repChannelOnly}
              onCheckedChange={(val) => {
                updateForm("repChannelOnly", val);
                onBlurSave?.();
              }}
            />
            <div>
              <span className="text-sm font-medium">Rep Channel Only <InfoTip text="Restricts this plan to sales rep distribution only. Members cannot self-enroll; a rep must assign them." /></span>
              <p className="text-[10px] text-muted-foreground">Can only be sold by sales reps</p>
            </div>
          </label>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Geo Restrictions <InfoTip text="Limit plan availability to specific countries using ISO codes. Leave empty to allow worldwide access." /></Label>
          <Input
            value={form.geoRestriction}
            onChange={(e) => updateForm("geoRestriction", e.target.value)}
            onBlur={onBlurSave}
            placeholder="e.g. US, CA, GB (comma-separated country codes, empty = no restriction)"
          />
          <p className="text-[10px] text-muted-foreground">
            Comma-separated ISO country codes. Leave empty for worldwide access.
          </p>
        </div>
      </div>
    </div>
  );
}
