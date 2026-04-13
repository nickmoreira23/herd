import type { Agent, AgentSkill, AgentKnowledgeItem } from "@prisma/client";

// ─── Types ─────────────────────────────────────────────────────

export interface AgentWithRelations extends Agent {
  skills: AgentSkill[];
  knowledgeItems: AgentKnowledgeItem[];
}

// ─── Build System Prompt ───────────────────────────────────────

/**
 * Compose a system prompt from the agent's DB config + runtime context.
 *
 * Layers:
 * 1. Agent base systemPrompt (from DB)
 * 2. Enabled skill prompt fragments
 * 3. Knowledge item content
 * 4. Extra runtime context (e.g., plan list, block catalog)
 * 5. Behavior rules (confirmation tier, navigation rules)
 */
export function buildSystemPrompt(
  agent: AgentWithRelations,
  extraContext?: string
): string {
  const sections: string[] = [];

  // 1. Base system prompt
  if (agent.systemPrompt) {
    sections.push(agent.systemPrompt);
  }

  // 2. Enabled skills
  const enabledSkills = agent.skills.filter((s) => s.isEnabled);
  if (enabledSkills.length > 0) {
    const fragments = enabledSkills
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => s.promptFragment)
      .filter(Boolean);
    if (fragments.length > 0) {
      sections.push(`## Skills\n${fragments.join("\n\n")}`);
    }
  }

  // 3. Knowledge items (active only)
  const activeKnowledge = agent.knowledgeItems.filter(
    (k) => k.status === "ACTIVE" && k.content
  );
  if (activeKnowledge.length > 0) {
    const items = activeKnowledge
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 10) // Cap at 10 to avoid prompt bloat
      .map((k) => `### ${k.title}\n${k.content}`)
      .join("\n\n");
    sections.push(`## Knowledge Base\n${items}`);
  }

  // 4. Extra runtime context
  if (extraContext) {
    sections.push(extraContext);
  }

  // 5. Behavior rules
  const behaviorRules = buildBehaviorRules(agent);
  if (behaviorRules) {
    sections.push(behaviorRules);
  }

  return sections.join("\n\n");
}

// ─── Behavior Rules ────────────────────────────────────────────

function buildBehaviorRules(agent: Agent): string | null {
  const rules: string[] = [];

  // Confirmation tier
  if (agent.confirmationTier === "tiered") {
    rules.push(`## Confirmation for Operations
- **Simple changes** (1-5 operations on 1-2 entities): Execute immediately without asking.
- **Medium changes** (6-15 operations or 3+ entities): Briefly list your plan, then execute without waiting.
- **Large/complex changes** (15+ operations, structural changes, or anything destructive): Present a clear summary and **ask the user to confirm** before executing.
- **Destructive operations** (bulk deletes, resetting fields): Always confirm first, regardless of size.`);
  } else if (agent.confirmationTier === "simple") {
    rules.push(`## Confirmation Rules
- For destructive operations (delete, reset), always confirm with the user first.
- For all other operations, execute immediately.`);
  }

  // Navigation rules
  if (!agent.autoNavigate) {
    rules.push(`## Navigation Rules
- **Do NOT auto-navigate** after making changes. The user's page updates in real-time as you work.
- **Only navigate** when the user explicitly asks to be taken somewhere.`);
  }

  // Persistent conversation
  if (agent.isConversational) {
    rules.push(`## Persistent Conversation
You have ONE continuous conversation thread. You can reference past discussions and build on previous work. The user may come back hours or days later — greet them naturally and pick up where you left off.`);
  }

  return rules.length > 0 ? rules.join("\n\n") : null;
}
