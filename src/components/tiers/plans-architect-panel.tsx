"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AgentPanel } from "@/components/agents/shared/agent-panel";

export function PlansArchitectPanel() {
  const router = useRouter();

  const handleSSEEvent = useCallback(
    (event: string, data: Record<string, unknown>) => {
      switch (event) {
        case "rule_created":
        case "rule_deleted":
          window.dispatchEvent(
            new CustomEvent("plan-agent:rules-changed", {
              detail: { planId: data.planId },
            })
          );
          break;
        case "plan_updated":
          window.dispatchEvent(
            new CustomEvent("plan-agent:plan-updated", {
              detail: {
                planId: data.planId,
                planName: data.planName,
                updatedFields: data.updatedFields,
              },
            })
          );
          break;
        case "benefits_updated":
          window.dispatchEvent(
            new CustomEvent("plan-agent:benefits-changed", {
              detail: { planId: data.planId, blockName: data.blockName },
            })
          );
          break;
        case "navigate": {
          const planId = data.planId as string;
          const tab = (data.tab as string) || "identity";
          router.push(`/admin/tiers/${planId}?tab=${tab}`);
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
      agentKey="plans-architect"
      displayName="Plans Architect"
      subtitle="Manages all plans & benefits"
      iconGradient="from-violet-500 to-purple-600"
      placeholder="Ask about plans..."
      emptyStateText="I manage all your subscription plans. Ask me to update plan settings, create discount rules, manage benefits, or work across multiple plans."
      suggestedPrompts={[
        "What plans do we have?",
        "Add 40% off supplements to Performance store",
        "Set Starter trial to 14 days",
      ]}
      onSSEEvent={handleSSEEvent}
    />
  );
}
