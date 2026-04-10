"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import type { TierFormState } from "../tier-detail-client";

interface TierInfo {
  id: string;
  name: string;
}

interface RulesTabProps {
  form: TierFormState;
  updateForm: (field: string, value: unknown) => void;
  onBlurSave?: () => void;
  allTiers?: TierInfo[];
  currentTierId?: string;
}

export function RulesTab({ form, updateForm, onBlurSave, allTiers, currentTierId }: RulesTabProps) {
  const otherTiers = allTiers?.filter((t) => t.id !== currentTierId) ?? [];

  function toggleTierId(field: "upgradeToTierIds" | "downgradeToTierIds", tierId: string) {
    const current: string[] = form[field];
    const next = current.includes(tierId)
      ? current.filter((id) => id !== tierId)
      : [...current, tierId];
    updateForm(field, next);
    onBlurSave?.();
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Plan Movement */}
      <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">Plan Movement</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Upgrades */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Upgrade Paths</Label>
            {otherTiers.length > 0 ? (
              <div className="space-y-1.5">
                {otherTiers.map((tier) => (
                  <label key={tier.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.upgradeToTierIds.includes(tier.id)}
                      onChange={() => toggleTierId("upgradeToTierIds", tier.id)}
                      className="rounded border-muted-foreground/30"
                    />
                    <span>{tier.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No other plans available</p>
            )}
            <div className="space-y-1.5 pt-2">
              <Label className="text-[10px] text-muted-foreground">Upgrade Timing</Label>
              <Select
                value={form.upgradeTiming}
                onValueChange={(val) => {
                  updateForm("upgradeTiming", val ?? "IMMEDIATE");
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                  <SelectItem value="NEXT_CYCLE">Next Billing Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Credits on Upgrade</Label>
              <Select
                value={form.creditOnUpgrade}
                onValueChange={(val) => {
                  updateForm("creditOnUpgrade", val ?? "CARRY_OVER");
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARRY_OVER">Carry Over</SelectItem>
                  <SelectItem value="RESET">Reset</SelectItem>
                  <SelectItem value="FORFEIT_EXCESS">Forfeit Excess</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Downgrades */}
          <div className="space-y-3">
            <Label className="text-xs font-medium">Downgrade Paths</Label>
            {otherTiers.length > 0 ? (
              <div className="space-y-1.5">
                {otherTiers.map((tier) => (
                  <label key={tier.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.downgradeToTierIds.includes(tier.id)}
                      onChange={() => toggleTierId("downgradeToTierIds", tier.id)}
                      className="rounded border-muted-foreground/30"
                    />
                    <span>{tier.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No other plans available</p>
            )}
            <div className="space-y-1.5 pt-2">
              <Label className="text-[10px] text-muted-foreground">Downgrade Timing</Label>
              <Select
                value={form.downgradeTiming}
                onValueChange={(val) => {
                  updateForm("downgradeTiming", val ?? "NEXT_CYCLE");
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">Immediate</SelectItem>
                  <SelectItem value="NEXT_CYCLE">Next Billing Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground">Credits on Downgrade</Label>
              <Select
                value={form.creditOnDowngrade}
                onValueChange={(val) => {
                  updateForm("creditOnDowngrade", val ?? "FORFEIT_EXCESS");
                  onBlurSave?.();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARRY_OVER">Carry Over</SelectItem>
                  <SelectItem value="RESET">Reset</SelectItem>
                  <SelectItem value="FORFEIT_EXCESS">Forfeit Excess</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
