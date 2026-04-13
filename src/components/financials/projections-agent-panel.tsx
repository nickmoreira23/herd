"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AgentPanel } from "@/components/agents/shared/agent-panel";
import { useFinancialStore } from "@/stores/financial-store";

export function ProjectionsAgentPanel() {
  const router = useRouter();
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

  return (
    <AgentPanel
      agentKey="projections-architect"
      displayName="Projections Architect"
      subtitle="Financial modeling & what-if analysis"
      iconGradient="from-emerald-500 to-teal-600"
      placeholder="Ask about projections..."
      emptyStateText="I manage all your financial projections. Ask me to run scenarios, tweak assumptions, compare models, or build new projections from live system data."
      suggestedPrompts={[
        "What scenarios do we have?",
        "Run a projection with current system defaults",
        "What happens if we double our sales reps?",
      ]}
      onSSEEvent={handleSSEEvent}
      getContext={getContext}
    />
  );
}
