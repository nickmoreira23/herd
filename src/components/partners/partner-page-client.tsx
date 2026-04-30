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
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface PartnerPageClientProps {
  initialPartners: PartnerWithAssignments[];
  tiers: SubscriptionTier[];
  locale: Locale;
}

export function PartnerPageClient({
  initialPartners,
  tiers,
  locale,
}: PartnerPageClientProps) {
  const t = useT();
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
        notifyError("error.partners.save_failed", t);
        return;
      }
      await refresh();
      notifySuccess(
        editPartner ? "partners.feedback.updated" : "partners.feedback.created",
        t,
      );
    },
    [editPartner, refresh, t]
  );

  const handleDelete = useCallback(
    async (partner: PartnerWithAssignments) => {
      if (!confirm(t("common.confirmDelete", { name: partner.name }))) return;
      const res = await fetch(`/api/partners/${partner.id}`, { method: "DELETE" });
      if (!res.ok) {
        notifyError("error.partners.delete_failed", t);
        return;
      }
      await refresh();
      notifySuccess("partners.feedback.deleted", t);
    },
    [refresh, t]
  );

  return (
    <>
      <div className="flex gap-1">
        <Button
          variant={tab === "partners" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("partners")}
        >
          {t("partners.list.tab_partners")}
        </Button>
        <Button
          variant={tab === "matrix" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("matrix")}
        >
          {t("partners.list.tab_matrix")}
        </Button>
        <Button
          variant={tab === "estimator" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("estimator")}
        >
          {t("partners.list.tab_estimator")}
        </Button>
      </div>

      {tab === "partners" && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-3 w-3" />
              {t("partners.list.new_partner")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setShowImport(true)}>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  {t("partners.list.import")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowExport(true)}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  {t("partners.list.export")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                locale={locale}
                onEdit={setEditPartner}
                onDelete={handleDelete}
              />
            ))}
          </div>
          {partners.length === 0 && (
            <div className="rounded-lg border p-8 text-center text-muted-foreground">
              {t("partners.list.empty")}
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

      {tab === "estimator" && (
        <KickbackEstimator partners={partners} locale={locale} />
      )}

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
