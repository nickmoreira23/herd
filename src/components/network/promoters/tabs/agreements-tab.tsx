"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, FileText, Calendar, Clock, Repeat } from "lucide-react";
import { toast } from "sonner";
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
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  DRAFT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  SUSPENDED: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
  TERMINATED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

export function AgreementsTab({ initialAgreements, partners, plans }: AgreementsTabProps) {
  const [agreements, setAgreements] = useState(initialAgreements);
  const [editAgreement, setEditAgreement] = useState<AgreementData | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/partner-agreements");
    const json = await res.json();
    if (json.data) setAgreements(json.data);
  }, []);

  const handleDelete = useCallback(async (agreement: AgreementData) => {
    if (!confirm(`Delete "${agreement.name}"?`)) return;
    await fetch(`/api/partner-agreements/${agreement.id}`, { method: "DELETE" });
    await refresh();
    toast.success("Agreement deleted");
  }, [refresh]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground max-w-lg">
            Partner agreements bundle a commission plan with clawback rules and payout schedules. Each D2D partner gets assigned an agreement.
          </p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Agreement
          </Button>
        </div>

        {agreements.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">No agreements yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create an agreement to assign a commission plan to a D2D partner.</p>
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
                        <Badge className={`text-[10px] px-1.5 py-0 ${STATUS_COLORS[ag.status]}`}>{ag.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ag.partner.name} — {ag.commissionPlan.name} v{ag.commissionPlan.version}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditAgreement(ag)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(ag)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Payout</p>
                      <p className="font-semibold text-sm capitalize">{ag.payoutCadence.toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hold</p>
                      <p className="font-semibold text-sm">{ag.holdPeriodDays} days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Effective</p>
                      <p className="font-semibold text-xs">{ag.effectiveFrom ? new Date(ag.effectiveFrom).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Ledger</p>
                      <p className="font-semibold text-sm">{ag._count.ledgerEntries} entries</p>
                    </div>
                  </div>
                </div>

                {ag.clawbackRules.length > 0 && (
                  <div className="flex gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground pt-1">Clawback:</span>
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
