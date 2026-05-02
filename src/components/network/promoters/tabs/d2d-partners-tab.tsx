"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Building2, Users, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { D2DPartnerEditor } from "../editors/d2d-partner-editor";
import { OrgTreeEditor } from "../editors/org-tree-editor";

interface OrgNodeData {
  id: string;
  name: string;
  roleType: string;
  parentId: string | null;
  email: string | null;
  isActive: boolean;
}

interface PartnerData {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  logoUrl: string | null;
  isActive: boolean;
  notes: string | null;
  orgNodes: OrgNodeData[];
  agreements: { id: string; name: string; status: string; commissionPlan: { name: string } }[];
  _count: { orgNodes: number; agreements: number };
}

interface D2DPartnersTabProps {
  initialPartners: PartnerData[];
}

export function D2DPartnersTab({ initialPartners }: D2DPartnersTabProps) {
  const t = useT();
  const [partners, setPartners] = useState(initialPartners);
  const [editPartner, setEditPartner] = useState<PartnerData | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/d2d-partners");
    const json = await res.json();
    if (json.data) setPartners(json.data);
  }, []);

  const handleDelete = useCallback(async (partner: PartnerData) => {
    if (partner._count.agreements > 0) {
      notifyError("error.network.promoters.partners.delete_with_agreements", t);
      return;
    }
    if (!confirm(t("network.promoters.partners.confirm_delete", { name: partner.name }))) return;
    await fetch(`/api/d2d-partners/${partner.id}`, { method: "DELETE" });
    await refresh();
    notifySuccess("network.promoters.feedback.partner_deleted", t);
  }, [refresh, t]);

  const roleCount = (nodes: OrgNodeData[], role: string) => nodes.filter(n => n.roleType === role).length;

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground max-w-lg">
            {t("network.promoters.partners.description")}
          </p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("network.promoters.partners.new_button")}
          </Button>
        </div>

        {partners.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">{t("network.promoters.partners.empty_title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("network.promoters.partners.empty_description")}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {partners.map((partner) => (
            <Card key={partner.id} className={!partner.isActive ? "opacity-60" : ""}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{partner.name}</h3>
                        {!partner.isActive && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t("network.promoters.partners.inactive_badge")}</Badge>}
                      </div>
                      {partner.contactName && <p className="text-xs text-muted-foreground">{partner.contactName} {partner.contactEmail && `— ${partner.contactEmail}`}</p>}
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditPartner(partner)} title={t("common.actions.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(partner)} title={t("common.actions.delete")}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.partners.metric.regional")}</p>
                      <p className="font-semibold text-sm">{roleCount(partner.orgNodes, "REGIONAL_LEADER")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.partners.metric.team_leads")}</p>
                      <p className="font-semibold text-sm">{roleCount(partner.orgNodes, "TEAM_LEAD")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.partners.metric.reps")}</p>
                      <p className="font-semibold text-sm">{roleCount(partner.orgNodes, "REP")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.partners.metric.agreements")}</p>
                      <p className="font-semibold text-sm">{partner._count.agreements}</p>
                    </div>
                  </div>
                </div>

                {/* Expand/collapse org tree */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => setExpandedPartner(expandedPartner === partner.id ? null : partner.id)}
                >
                  {expandedPartner === partner.id ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
                  {expandedPartner === partner.id ? t("network.promoters.partners.hide_org_tree") : t("network.promoters.partners.show_org_tree")} ({t("network.promoters.partners.people_count", { count: partner.orgNodes.length })})
                </Button>

                {expandedPartner === partner.id && (
                  <div className="mt-3 border-t pt-3">
                    <OrgTreeEditor partnerId={partner.id} nodes={partner.orgNodes} onRefresh={refresh} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <D2DPartnerEditor
        partner={editPartner}
        open={showCreate || !!editPartner}
        onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditPartner(null); } }}
        onSaved={() => { refresh(); setShowCreate(false); setEditPartner(null); }}
      />
    </>
  );
}
