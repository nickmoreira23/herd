"use client";

import { useState, useCallback } from "react";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { PartnerCard } from "./partner-card";
import { PartnerFormModal } from "./partner-form-modal";
import { TierAssignmentMatrix } from "./tier-assignment-matrix";
import { KickbackEstimator } from "./kickback-estimator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportModal } from "@/components/shared/export-modal";
import { ImportModal } from "@/components/shared/import-modal";
import { partnerConfig } from "@/lib/import-export/entity-config";
import { Plus, MoreHorizontal, Download, Upload } from "lucide-react";
import { toast } from "sonner";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface PartnerPageClientProps {
  initialPartners: PartnerWithAssignments[];
  tiers: SubscriptionTier[];
}

export function PartnerPageClient({
  initialPartners,
  tiers,
}: PartnerPageClientProps) {
  const [partners, setPartners] = useState(initialPartners);
  const [editPartner, setEditPartner] = useState<PartnerWithAssignments | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"partners" | "matrix" | "estimator">("partners");
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/partners");
    const json = await res.json();
    if (json.data) setPartners(json.data);
  }, []);

  const handleSave = useCallback(
    async (data: Record<string, unknown>) => {
      const url = editPartner
        ? `/api/partners/${editPartner.id}`
        : "/api/partners";
      const method = editPartner ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      await refresh();
      toast.success(editPartner ? "Updated" : "Created");
    },
    [editPartner, refresh]
  );

  const handleDelete = useCallback(
    async (partner: PartnerWithAssignments) => {
      if (!confirm(`Delete "${partner.name}"?`)) return;
      await fetch(`/api/partners/${partner.id}`, { method: "DELETE" });
      await refresh();
      toast.success("Deleted");
    },
    [refresh]
  );

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant={tab === "partners" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("partners")}
        >
          Partners
        </Button>
        <Button
          variant={tab === "matrix" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("matrix")}
        >
          Tier Matrix
        </Button>
        <Button
          variant={tab === "estimator" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("estimator")}
        >
          Revenue Estimator
        </Button>
      </div>

      {tab === "partners" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-3 w-3" />
              New Partner
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setShowImport(true)}>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Import Spreadsheet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowExport(true)}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Export Spreadsheet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onEdit={setEditPartner}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {partners.length === 0 && (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              No partners yet. Click &quot;New Partner&quot; to add one.
            </div>
          )}
        </div>
      )}

      {tab === "matrix" && (
        <TierAssignmentMatrix
          partners={partners}
          tiers={tiers}
          onRefresh={refresh}
        />
      )}

      {tab === "estimator" && <KickbackEstimator partners={partners} />}

      <PartnerFormModal
        partner={editPartner}
        open={showCreate || !!editPartner}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setEditPartner(null);
          }
        }}
        onSave={handleSave}
      />

      <ExportModal
        open={showExport}
        onOpenChange={setShowExport}
        entityConfig={partnerConfig}
      />

      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        entityConfig={partnerConfig}
        onComplete={refresh}
      />
    </>
  );
}
