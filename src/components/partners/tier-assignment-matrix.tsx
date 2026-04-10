"use client";

import { useState, useCallback } from "react";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toNumber } from "@/lib/utils";
import { toast } from "sonner";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface TierAssignmentMatrixProps {
  partners: PartnerWithAssignments[];
  tiers: SubscriptionTier[];
  onRefresh: () => void;
}

export function TierAssignmentMatrix({
  partners,
  tiers,
  onRefresh,
}: TierAssignmentMatrixProps) {
  // Build initial matrix: partnerId -> tierId -> discountPercent string
  const [matrix, setMatrix] = useState<Record<string, Record<string, string>>>(() => {
    const m: Record<string, Record<string, string>> = {};
    for (const partner of partners) {
      m[partner.id] = {};
      for (const tier of tiers) {
        const assignment = partner.tierAssignments.find(
          (a) => a.subscriptionTierId === tier.id
        );
        m[partner.id][tier.id] = assignment
          ? String(toNumber(assignment.discountPercent))
          : "";
      }
    }
    return m;
  });
  const [saving, setSaving] = useState(false);

  const updateCell = useCallback(
    (partnerId: string, tierId: string, value: string) => {
      setMatrix((prev) => ({
        ...prev,
        [partnerId]: { ...prev[partnerId], [tierId]: value },
      }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const assignments: {
        partnerBrandId: string;
        subscriptionTierId: string;
        discountPercent: number;
        isActive: boolean;
      }[] = [];

      for (const [partnerId, tierMap] of Object.entries(matrix)) {
        for (const [tierId, value] of Object.entries(tierMap)) {
          const num = parseFloat(value);
          assignments.push({
            partnerBrandId: partnerId,
            subscriptionTierId: tierId,
            discountPercent: isNaN(num) ? 0 : num,
            isActive: !isNaN(num) && num > 0,
          });
        }
      }

      const res = await fetch("/api/partners/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save assignments");
        return;
      }

      onRefresh();
      toast.success("Tier assignments saved");
    } finally {
      setSaving(false);
    }
  }, [matrix, onRefresh]);

  const activePartners = partners.filter((p) => p.isActive);

  if (activePartners.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No active partners. Create and activate partners first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Set discount percentages for each partner × tier combination.
        </p>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save All"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Partner</th>
              {tiers.map((tier) => (
                <th key={tier.id} className="p-3 text-center font-medium">
                  {tier.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activePartners.map((partner) => (
              <tr key={partner.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{partner.name}</td>
                {tiers.map((tier) => (
                  <td key={tier.id} className="p-2 text-center">
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      placeholder="0"
                      className="w-20 mx-auto text-center"
                      value={matrix[partner.id]?.[tier.id] ?? ""}
                      onChange={(e) =>
                        updateCell(partner.id, tier.id, e.target.value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
