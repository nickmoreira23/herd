"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, FileText, Calendar, Clock, Repeat } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess } from "@/lib/i18n/notify";
import { formatDate } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { AgreementEditor } from "../editors/agreement-editor";

interface AgreementData {
  id: string;
  name: string;
  status: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  payoutCadence: string;
  holdPeriodDays: number;
  notes: string | null;
  partner: { id: string; name: string };
  commissionPlan: { id: string; name: string; version: number };
  clawbackRules: { id: string; windowDays: number; clawbackPercent: number }[];
  _count: { ledgerEntries: number };
}

interface PartnerOption { id: string; name: string }
interface PlanOption { id: string; name: string; version: number }

interface AgreementsTabProps {
  initialAgreements: AgreementData[];
  partners: PartnerOption[];
  plans: PlanOption[];
  locale: Locale;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  SUSPENDED: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

const STATUS_KEYS: Record<string, MessageKey> = {
  ACTIVE: "network.promoters.agreements.status.active",
  DRAFT: "network.promoters.agreements.status.draft",
  SUSPENDED: "network.promoters.agreements.status.suspended",
  TERMINATED: "network.promoters.agreements.status.terminated",
};

const CADENCE_KEYS: Record<string, MessageKey> = {
  WEEKLY: "network.promoters.agreements.cadence.weekly",
  BIWEEKLY: "network.promoters.agreements.cadence.biweekly",
  MONTHLY: "network.promoters.agreements.cadence.monthly",
  QUARTERLY: "network.promoters.agreements.cadence.quarterly",
};

export function AgreementsTab({ initialAgreements, partners, plans, locale }: AgreementsTabProps) {
  const t = useT();
  const [agreements, setAgreements] = useState(initialAgreements);
  const [editAgreement, setEditAgreement] = useState<AgreementData | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/partner-agreements");
    const json = await res.json();
    if (json.data) setAgreements(json.data);
  }, []);

  const handleDelete = useCallback(async (agreement: AgreementData) => {
    if (!confirm(t("network.promoters.agreements.confirm_delete", { name: agreement.name }))) return;
    await fetch(`/api/partner-agreements/${agreement.id}`, { method: "DELETE" });
    await refresh();
    notifySuccess("network.promoters.feedback.agreement_deleted", t);
  }, [refresh, t]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground max-w-lg">
            {t("network.promoters.agreements.description")}
          </p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("network.promoters.agreements.new_button")}
          </Button>
        </div>

        {agreements.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">{t("network.promoters.agreements.empty_title")}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("network.promoters.agreements.empty_description")}</p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {agreements.map((ag) => (
            <Card key={ag.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{ag.name}</h3>
                        <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[ag.status]}`}>
                          {STATUS_KEYS[ag.status] ? t(STATUS_KEYS[ag.status]) : ag.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ag.partner.name} — {ag.commissionPlan.name} v{ag.commissionPlan.version}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditAgreement(ag)} title={t("common.actions.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(ag)} title={t("common.actions.delete")}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.agreements.metric.payout")}</p>
                      <p className="font-semibold text-sm">
                        {CADENCE_KEYS[ag.payoutCadence] ? t(CADENCE_KEYS[ag.payoutCadence]) : ag.payoutCadence}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.agreements.metric.hold")}</p>
                      <p className="font-semibold text-sm">{t("network.promoters.agreements.metric.hold_days", { days: ag.holdPeriodDays })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.agreements.metric.effective")}</p>
                      <p className="font-semibold text-xs">{ag.effectiveFrom ? formatDate(new Date(ag.effectiveFrom), locale, "short") : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.agreements.metric.ledger")}</p>
                      <p className="font-semibold text-sm">{t("network.promoters.agreements.metric.ledger_entries", { count: ag._count.ledgerEntries })}</p>
                    </div>
                  </div>
                </div>

                {ag.clawbackRules.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground pt-1">{t("network.promoters.agreements.clawback_label")}</span>
                    {ag.clawbackRules.map(rule => (
                      <Badge key={rule.id} variant="outline" className="text-[10px]">
                        {rule.windowDays}d = {rule.clawbackPercent}%
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AgreementEditor
        agreement={editAgreement}
        partners={partners}
        plans={plans}
        open={showCreate || !!editAgreement}
        onOpenChange={(open) => { if (!open) { setShowCreate(false); setEditAgreement(null); } }}
        onSaved={() => { refresh(); setShowCreate(false); setEditAgreement(null); }}
      />
    </>
  );
}
