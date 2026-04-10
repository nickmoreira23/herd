"use client";

import type { AgentFormState } from "../agent-detail-client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings2 } from "lucide-react";

interface SettingsTabProps {
  form: AgentFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
}

export function SettingsTab({
  form,
  updateForm,
  onBlurSave,
}: SettingsTabProps) {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-1.5">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Capabilities
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <Label className="text-sm font-medium">Requires Media</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Agent needs image or video input from the user (e.g. form check,
                photo logging)
              </p>
            </div>
            <Switch
              checked={form.requiresMedia}
              onCheckedChange={(val) => {
                updateForm("requiresMedia", val);
                onBlurSave?.();
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <Label className="text-sm font-medium">
                Requires Health Data
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Agent accesses member health metrics (weight, body composition,
                vitals)
              </p>
            </div>
            <Switch
              checked={form.requiresHealth}
              onCheckedChange={(val) => {
                updateForm("requiresHealth", val);
                onBlurSave?.();
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
            <div>
              <Label className="text-sm font-medium">Conversational</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Multi-turn conversation agent vs single-shot request/response
              </p>
            </div>
            <Switch
              checked={form.isConversational}
              onCheckedChange={(val) => {
                updateForm("isConversational", val);
                onBlurSave?.();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
