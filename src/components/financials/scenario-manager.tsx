"use client";

import { useState, useCallback, useEffect } from "react";
import { useFinancialStore } from "@/stores/financial-store";
import type { FinancialInputs } from "@/lib/financial-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Download, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

export function ScenarioManager() {
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
      toast.error("Enter a scenario name");
      return;
    }
    if (!results) {
      toast.error("No results to save");
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
        const json = await res.json();
        toast.error(json.error || "Failed to save");
        return;
      }
      await fetchScenarios();
      toast.success("Scenario saved");
    } finally {
      setSaving(false);
    }
  }, [scenarioName, inputs, results, fetchScenarios]);

  const handleLoad = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/financials/${id}`);
      const json = await res.json();
      if (json.data) {
        loadInputs(
          json.data.assumptions as FinancialInputs,
          json.data.scenarioName || ""
        );
        toast.success("Scenario loaded");
      }
    },
    [loadInputs]
  );

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Delete scenario "${name}"?`)) return;
      await fetch(`/api/financials/${id}`, { method: "DELETE" });
      await fetchScenarios();
      toast.success("Deleted");
    },
    [fetchScenarios]
  );

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center gap-1.5 mb-3">
          <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Scenarios
          </span>
        </div>

        {/* Save Current */}
        <div className="flex gap-2">
          <Input
            placeholder="Scenario name..."
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button size="sm" onClick={handleSave} disabled={saving} className="text-sm">
            <Save className="mr-1 h-3 w-3" />
            {saving ? "..." : "Save"}
          </Button>
        </div>

        {/* Saved Scenarios */}
        {savedScenarios.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Saved
            </p>
            {savedScenarios.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border bg-background px-2.5 py-1.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleLoad(s.id)}
                    title="Load this scenario"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(s.id, s.name)}
                    title="Delete this scenario"
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
