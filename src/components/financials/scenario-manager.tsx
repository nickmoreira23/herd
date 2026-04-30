"use client";

import { useState, useCallback, useEffect } from "react";
import { useFinancialStore } from "@/stores/financial-store";
import type { FinancialInputs } from "@/lib/financial-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Download, Trash2, FolderOpen } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { Locale } from "@/lib/i18n/locales";
import { formatDate } from "@/lib/i18n/format-date";

interface ScenarioManagerProps {
  locale: Locale;
}

export function ScenarioManager({ locale }: ScenarioManagerProps) {
  const t = useT();
  const {
    inputs,
    results,
    scenarioName,
    setScenarioName,
    savedScenarios,
    setSavedScenarios,
    loadInputs,
  } = useFinancialStore();

  const [saving, setSaving] = useState(false);

  const fetchScenarios = useCallback(async () => {
    const res = await fetch("/api/financials");
    const json = await res.json();
    if (json.data) setSavedScenarios(json.data);
  }, [setSavedScenarios]);

  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios]);

  const handleSave = useCallback(async () => {
    if (!scenarioName.trim()) {
      notifyError("financials.scenarios.error_enter_name", t);
      return;
    }
    if (!results) {
      notifyError("financials.scenarios.error_no_results", t);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioName: scenarioName.trim(),
          assumptions: inputs,
          results,
        }),
      });
      if (!res.ok) {
        notifyError("financials.scenarios.error_save_failed", t);
        return;
      }
      await fetchScenarios();
      notifySuccess("financials.scenarios.feedback.saved", t);
    } finally {
      setSaving(false);
    }
  }, [scenarioName, inputs, results, fetchScenarios, t]);

  const handleLoad = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/financials/${id}`);
      const json = await res.json();
      if (json.data) {
        loadInputs(
          json.data.assumptions as FinancialInputs,
          json.data.scenarioName || ""
        );
        notifySuccess("financials.scenarios.feedback.loaded", t);
      }
    },
    [loadInputs, t]
  );

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(t("financials.scenarios.confirm_delete", { name }))) return;
      await fetch(`/api/financials/${id}`, { method: "DELETE" });
      await fetchScenarios();
      notifySuccess("financials.scenarios.feedback.deleted", t);
    },
    [fetchScenarios, t]
  );

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center gap-1.5 mb-3">
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            {t("financials.scenarios.title")}
          </span>
        </div>

        {/* Save Current */}
        <div className="flex gap-2">
          <Input
            placeholder={t("financials.scenarios.placeholder")}
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-sm">
            <Save className="mr-1 h-3 w-3" />
            {saving
              ? t("common.states.saving")
              : t("financials.scenarios.action_save")}
          </Button>
        </div>

        {/* Saved Scenarios */}
        {savedScenarios.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {t("financials.scenarios.section_saved")}
            </p>
            {savedScenarios.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border bg-background px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(new Date(s.createdAt), locale, "short")}
                  </p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleLoad(s.id)}
                    title={t("financials.scenarios.action_load_title")}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(s.id, s.name)}
                    title={t("financials.scenarios.action_delete_title")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
