"use client";

import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Handshake, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PartnerAssignment {
  id: string;
  partnerId: string;
  subscriptionTierId: string;
  discountPercent: number;
  partner: {
    id: string;
    name: string;
    contactEmail: string | null;
  };
}

interface Partner {
  id: string;
  name: string;
  contactEmail: string | null;
}

interface PartnersTabProps {
  tierId: string;
  onBenefitSaved?: () => void;
}

export function PartnersTab({ tierId, onBenefitSaved }: PartnersTabProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [assignments, setAssignments] = useState<PartnerAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [partnersRes, assignmentsRes] = await Promise.all([
        fetch("/api/partners"),
        fetch(`/api/partners/assignments?tierId=${tierId}`),
      ]);
      const partnersJson = await partnersRes.json();
      const assignmentsJson = await assignmentsRes.json();
      if (partnersJson.data) setPartners(partnersJson.data);
      if (assignmentsJson.data) setAssignments(assignmentsJson.data);
    } catch {
      toast.error("Failed to load partner data");
    } finally {
      setLoading(false);
    }
  }, [tierId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const togglePartner = useCallback(
    async (partnerId: string, enabled: boolean) => {
      if (enabled) {
        // Create assignment
        const res = await fetch("/api/partners/assignments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnerId,
            subscriptionTierId: tierId,
            discountPercent: 0,
          }),
        });
        if (res.ok) {
          await fetchData();
          toast.success("Partner assigned");
          onBenefitSaved?.();
        }
      } else {
        // Find and delete assignment
        const assignment = assignments.find((a) => a.partnerId === partnerId);
        if (assignment) {
          const res = await fetch(`/api/partners/assignments/${assignment.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            await fetchData();
            toast.success("Partner removed");
            onBenefitSaved?.();
          }
        }
      }
    },
    [tierId, assignments, fetchData]
  );

  const updateDiscount = useCallback(
    async (assignmentId: string, discountPercent: number) => {
      const res = await fetch(`/api/partners/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountPercent }),
      });
      if (res.ok) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === assignmentId ? { ...a, discountPercent } : a))
        );
        toast.success("Discount updated");
        onBenefitSaved?.();
      }
    },
    [onBenefitSaved]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const assignedIds = new Set(assignments.map((a) => a.partnerId));

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Handshake className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Partner Access</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {assignments.length} of {partners.length} assigned
        </span>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No partners created yet.</p>
          <p className="text-xs mt-1">Create partners in the Partners section first.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {partners.map((partner) => {
            const assignment = assignments.find((a) => a.partnerId === partner.id);
            const isAssigned = assignedIds.has(partner.id);

            return (
              <div
                key={partner.id}
                className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Switch
                    checked={isAssigned}
                    onCheckedChange={(val) => togglePartner(partner.id, val)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{partner.name}</p>
                    {partner.contactEmail && (
                      <p className="text-xs text-muted-foreground truncate">{partner.contactEmail}</p>
                    )}
                  </div>
                </div>
                {isAssigned && assignment && (
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">Discount</span>
                    <div className="relative w-20">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={assignment.discountPercent}
                        onChange={(e) => {
                          // Optimistic local update
                          const val = parseFloat(e.target.value) || 0;
                          setAssignments((prev) =>
                            prev.map((a) =>
                              a.id === assignment.id ? { ...a, discountPercent: val } : a
                            )
                          );
                        }}
                        onBlur={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          updateDiscount(assignment.id, val);
                        }}
                        className="h-7 text-xs pr-5"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
