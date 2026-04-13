"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { AgentPanel } from "@/components/agents/shared/agent-panel";

interface BlockAgentPanelProps {
  /** Block name matching the manifest (e.g. "events", "products") */
  blockName: string;
  /** Display name for the header (e.g. "Events") */
  blockDisplayName: string;
}

/**
 * Thin wrapper around the shared AgentPanel for block-scoped agents.
 * Maps blockName → agent key "block-{blockName}" and dispatches
 * router.refresh() on mutations.
 */
export function BlockAgentPanel({
  blockName,
  blockDisplayName,
}: BlockAgentPanelProps) {
  const router = useRouter();

  const handleSSEEvent = useCallback(
    (event: string) => {
      if (event === "done") {
        router.refresh();
      }
    },
    [router]
  );

  return (
    <AgentPanel
      agentKey={`block-${blockName}`}
      displayName={`${blockDisplayName} Agent`}
      subtitle={`Specialist for ${blockDisplayName.toLowerCase()}`}
      placeholder={`Ask about ${blockDisplayName.toLowerCase()}...`}
      emptyStateText={`I'm your specialist for everything ${blockDisplayName.toLowerCase()}-related. Ask me anything about the data in this block.`}
      panelWidth={380}
      onSSEEvent={handleSSEEvent}
    />
  );
}
