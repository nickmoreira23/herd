"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface CommunityBenefitInfo {
  id: string;
  name: string;
  key: string;
  description: string | null;
  icon: string;
  platform: string | null;
  status: string;
}

interface TierAssignmentRow {
  id: string;
  communityBenefitId: string;
  isEnabled: boolean;
  communityBenefit: CommunityBenefitInfo;
}

interface CommunityTabProps {
  tierId: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  discord: "Discord",
  zoom: "Zoom",
  forum: "Forum",
  "in-person": "In-Person",
};

export function CommunityTab({ tierId }: CommunityTabProps) {
  const [allBenefits, setAllBenefits] = useState<CommunityBenefitInfo[]>([]);
  const [enabledIds, setEnabledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Fetch all active community benefits and current tier assignments
  useEffect(() => {
    async function load() {
      try {
        const [benefitsRes, assignmentsRes] = await Promise.all([
          fetch("/api/community?status=ACTIVE"),
          fetch(`/api/tiers/${tierId}/community`),
        ]);
        const benefitsJson = await benefitsRes.json();
        const assignmentsJson = await assignmentsRes.json();

        const benefits: CommunityBenefitInfo[] = (benefitsJson.data || []).map(
          (b: CommunityBenefitInfo & { _count?: unknown }) => ({
            id: b.id,
            name: b.name,
            key: b.key,
            description: b.description,
            icon: b.icon,
            platform: b.platform,
            status: b.status,
          })
        );
        setAllBenefits(benefits);

        // Build enabled set from existing assignments
        const enabled = new Set<string>();
        for (const row of (assignmentsJson.data || []) as TierAssignmentRow[]) {
          if (row.isEnabled) {
            enabled.add(row.communityBenefitId);
          }
        }
        setEnabledIds(enabled);
      } catch {
        toast.error("Failed to load community benefits");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tierId]);

  const saveAssignments = useCallback(
    async (newEnabled: Set<string>) => {
      const assignments = allBenefits.map((b) => ({
        communityBenefitId: b.id,
        isEnabled: newEnabled.has(b.id),
      }));
      try {
        const res = await fetch(`/api/tiers/${tierId}/community`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments }),
        });
        if (!res.ok) {
          toast.error("Failed to save");
        }
      } catch {
        toast.error("Failed to save");
      }
    },
    [tierId, allBenefits]
  );

  const toggleBenefit = useCallback(
    (benefitId: string, enabled: boolean) => {
      const next = new Set(enabledIds);
      if (enabled) {
        next.add(benefitId);
      } else {
        next.delete(benefitId);
      }
      setEnabledIds(next);
      saveAssignments(next);
    },
    [enabledIds, saveAssignments]
  );

  const enabledCount = enabledIds.size;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Loading community benefits...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Community Benefits</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {enabledCount} of {allBenefits.length} enabled
        </span>
      </div>

      <div className="space-y-2">
        {allBenefits.map((benefit) => {
          const isEnabled = enabledIds.has(benefit.id);
          return (
            <div
              key={benefit.id}
              className="rounded-lg border bg-card px-4 py-3"
            >
              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{benefit.name}</p>
                    {benefit.platform && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-normal"
                      >
                        {PLATFORM_LABELS[benefit.platform] || benefit.platform}
                      </Badge>
                    )}
                  </div>
                  {benefit.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {benefit.description}
                    </p>
                  )}
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(val) => toggleBenefit(benefit.id, val)}
                />
              </label>
            </div>
          );
        })}

        {allBenefits.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-8">
            No community benefits configured yet. Add benefits from the{" "}
            <Link href="/admin/community" className="text-brand underline">
              Community
            </Link>{" "}
            page.
          </div>
        )}
      </div>
    </div>
  );
}
