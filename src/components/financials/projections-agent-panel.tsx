"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { AgentPanel } from "@/components/agents/shared/agent-panel";
import { useFinancialStore } from "@/stores/financial-store";
import { useT } from "@/lib/i18n/locale-context";

export function ProjectionsAgentPanel() {
  const router = useRouter();
  const t = useT();
  const inputs = useFinancialStore((s) => s.inputs);
  const results = useFinancialStore((s) => s.results);

  // Provide live editor state to the agent with every message
  const getContext = useCallback(() => {
    if (!inputs) return undefined;
    return {
      liveEditorState: {
        inputs,
        results: results ?? undefined,
      },
    };
  }, [inputs, results]);

  const handleSSEEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case "scenario_saved":
          window.dispatchEvent(
            new CustomEvent("projections-agent:scenario-saved", {
              detail: {
                scenarioId: data.scenarioId,
                name: data.name,
              },
            })
          );
          break;
        case "scenario_deleted":
          window.dispatchEvent(
            new CustomEvent("projections-agent:scenario-deleted", {
              detail: { scenarioId: data.scenarioId },
            })
          );
          break;
        case "navigate": {
          const scenarioId = data.scenarioId as string;
          router.push(`/admin/operation/finances/projections/${scenarioId}`);
          break;
        }
        case "done":
          router.refresh();
          break;
      }
    },
    [router]
  );

  const suggestedPrompts = useMemo(
    () => [
      t("financials.agent.prompt_what_scenarios"),
      t("financials.agent.prompt_default_run"),
      t("financials.agent.prompt_what_if_reps"),
    ],
    [t]
  );

  return (
    <AgentPanel
      agentKey="projections-architect"
      displayName={t("financials.agent.display_name")}
      subtitle={t("financials.agent.subtitle")}
      iconGradient="from-emerald-500 to-teal-600"
      placeholder={t("financials.agent.placeholder")}
      emptyStateText={t("financials.agent.empty_state")}
      suggestedPrompts={suggestedPrompts}
      onSSEEvent={handleSSEEvent}
      getContext={getContext}
    />
  );
}
