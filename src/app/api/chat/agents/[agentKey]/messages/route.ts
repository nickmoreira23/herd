import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-utils";
import { resolveAnthropicKey } from "@/lib/integrations";
import { createAgentStream, sseResponse } from "@/lib/agents/runtime";
import { findOrCreateConversation } from "@/lib/agents/conversation";
import { blockRegistry, actionToBlock } from "@/lib/blocks/registry";
import { searchData, SEARCH_DATA_TOOL } from "@/lib/chat/data-retrieval";
import {
  EXECUTE_ACTION_TOOL,
  executeAction,
  formatActionResult,
} from "@/lib/chat/action-execution";
import {
  PLAN_AGENT_TOOLS,
  handlePlanAgentToolCall,
  buildPlanAgentContext,
} from "@/lib/agents/handlers/plan-agent";
import {
  PROJECTIONS_AGENT_TOOLS,
  handleProjectionsToolCall,
  buildProjectionsAgentContext,
} from "@/lib/agents/handlers/projections-agent";

// ─── Route Handler ─────────────────────────────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentKey: string }> }
) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return apiError("Unauthorized", 401);

  let anthropic: Anthropic;
  try {
    const apiKey = await resolveAnthropicKey();
    anthropic = new Anthropic({ apiKey });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : "API key not configured",
      500
    );
  }

  const { agentKey } = await params;

  // Look up agent from DB
  const agent = await prisma.agent.findUnique({
    where: { key: agentKey },
    include: {
      tools: { where: { isEnabled: true }, orderBy: { sortOrder: "asc" } },
      skills: { where: { isEnabled: true }, orderBy: { sortOrder: "asc" } },
      knowledgeItems: { where: { status: "ACTIVE" }, orderBy: { priority: "desc" } },
    },
  });

  if (!agent) {
    return apiError(`Agent not found: ${agentKey}`, 404);
  }

  let body: {
    conversationId?: string;
    content: string;
    context?: Record<string, unknown>;
    attachments?: Array<{
      type: string;
      url: string;
      mimeType: string;
      fileName?: string;
    }>;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  if (!body.content?.trim()) {
    return apiError("content is required", 400);
  }

  // Find or create conversation for this agent + user
  const conversationId =
    body.conversationId ||
    (await findOrCreateConversation(agent.id, userId));

  // Verify conversation belongs to user
  if (body.conversationId) {
    const conv = await prisma.chatConversation.findFirst({
      where: { id: body.conversationId, userId },
    });
    if (!conv) return apiError("Conversation not found", 404);
  }

  // Build role-specific tools and context
  const { extraTools, extraSystemPrompt, onToolCall } = await buildRoleConfig(
    agent,
    userId,
    body.context
  );

  const stream = createAgentStream({
    agent,
    conversationId,
    userMessage: body.content,
    anthropic,
    extraTools,
    extraSystemPrompt,
    onToolCall,
    attachments: body.attachments,
  });

  return sseResponse(stream);
}

// ─── Role-Specific Configuration ───────────────────────────────

async function buildRoleConfig(
  agent: {
    role: string;
    scope: string | null;
    key: string;
  },
  userId: string,
  clientContext?: Record<string, unknown>
): Promise<{
  extraTools: Anthropic.Tool[];
  extraSystemPrompt: string;
  onToolCall?: (
    name: string,
    input: Record<string, unknown>,
    send: (event: string, data: unknown) => void
  ) => Promise<string | null>;
}> {
  switch (agent.role) {
    case "BLOCK":
      return buildBlockConfig(agent.scope || agent.key, userId);

    case "SPECIALIST":
      return buildSpecialistConfig(agent.key, clientContext);

    case "ORCHESTRATOR":
      return buildOrchestratorConfig(userId);

    default:
      return { extraTools: [], extraSystemPrompt: "" };
  }
}

// ─── Block Agent Config ────────────────────────────────────────

async function buildBlockConfig(
  blockName: string,
  userId: string
): Promise<{
  extraTools: Anthropic.Tool[];
  extraSystemPrompt: string;
  onToolCall: (
    name: string,
    input: Record<string, unknown>,
    send: (event: string, data: unknown) => void
  ) => Promise<string | null>;
}> {
  const block = blockRegistry.get(blockName);

  if (!block) {
    return {
      extraTools: [],
      extraSystemPrompt: `Warning: Block "${blockName}" not found in registry.`,
      onToolCall: async () => null,
    };
  }

  // Build scoped action catalog
  const actionLines = block.actions.map((a) => {
    const required = a.requiredFields?.length
      ? ` (required: ${a.requiredFields.join(", ")})`
      : "";
    return `  - ${a.name}: ${a.description}${required}`;
  });
  const actionCatalog = `${block.displayName} [${block.name}]:\n${actionLines.join("\n")}`;

  // Scoped search tool
  const scopedSearchTool: Anthropic.Tool = {
    ...SEARCH_DATA_TOOL,
    description: `Search for ${block.displayName.toLowerCase()} data by keyword or specific item IDs.`,
    input_schema: {
      ...SEARCH_DATA_TOOL.input_schema,
      properties: {
        ...SEARCH_DATA_TOOL.input_schema.properties,
        types: {
          type: "array" as const,
          items: { type: "string" as const, enum: block.types },
          description: `Data types to search (defaults to all ${block.displayName} types)`,
        },
      },
    },
  };

  // Scoped action tool
  const blockActionNames = block.actions.map((a) => a.name);
  const scopedActionTool: Anthropic.Tool = {
    ...EXECUTE_ACTION_TOOL,
    description: `Execute a ${block.displayName} block action — create, update, delete, or perform operations.`,
    input_schema: {
      ...EXECUTE_ACTION_TOOL.input_schema,
      properties: {
        ...EXECUTE_ACTION_TOOL.input_schema.properties,
        action: {
          type: "string" as const,
          enum: blockActionNames,
          description: `The action to execute (must be a ${block.displayName} action)`,
        },
      },
    },
  };

  const extraSystemPrompt = `You are the ${block.displayName} Agent — a specialist AI assistant for the ${block.displayName} block in HERD OS.

IMPORTANT BOUNDARIES:
- You ONLY answer questions about ${block.displayName.toLowerCase()} and data within this block.
- If the user asks about something outside your scope, politely redirect them to the main HERD AI chat.
- Do NOT make up information. If you don't know, say so.

Your domain: ${block.description}

How to work:
1. Use the search_data tool to find ${block.displayName.toLowerCase()} data by keyword or specific IDs
2. Use the execute_action tool to create, update, or manage ${block.displayName.toLowerCase()} data
3. Always be specific and cite data you retrieved
4. For destructive actions (delete), always confirm with the user first

RULES FOR ACTIONS:
- Only use actions that belong to the "${block.name}" block (listed below)
- For create operations, gather all required fields before executing
- For updates, retrieve the current state first, then apply changes

=== AVAILABLE ACTIONS ===
${actionCatalog}`;

  const onToolCall = async (
    toolName: string,
    toolInput: Record<string, unknown>,
    send: (event: string, data: unknown) => void
  ): Promise<string | null> => {
    if (toolName === "execute_action") {
      const actionName = toolInput.action as string;
      const actionParams = (toolInput.params as Record<string, unknown>) || {};

      // Validate action belongs to this block
      const entry = actionToBlock.get(actionName);
      if (!entry || entry.block.name !== block.name) {
        return `Error: Action "${actionName}" does not belong to the ${block.displayName} block.`;
      }

      const result = await executeAction(actionName, actionParams, userId);
      const formatted = formatActionResult(result);

      // Emit activity event for mutations
      if (
        result.success &&
        ["POST", "PATCH", "PUT", "DELETE"].includes(
          entry.action.method.toUpperCase()
        )
      ) {
        const actionType = entry.action.method === "DELETE"
          ? "deleted"
          : entry.action.method === "POST"
            ? "created"
            : "updated";
        send("activity", {
          type: actionType,
          label: `${actionType} via ${actionName}`,
          blockName: block.name,
        });
      }

      return formatted;
    }

    if (toolName === "search_data") {
      const typedInput = toolInput as {
        item_ids?: string[];
        keyword?: string;
        types?: string[];
      };
      if (!typedInput.types || typedInput.types.length === 0) {
        typedInput.types = block.types;
      }

      const results = await searchData(typedInput);
      return results.length > 0
        ? results
            .map(
              (r) =>
                `=== ${r.type.toUpperCase()}: ${r.name} [${r.id}] ===\n${r.content}`
            )
            .join("\n\n")
        : "No results found.";
    }

    return null;
  };

  return {
    extraTools: [scopedSearchTool, scopedActionTool],
    extraSystemPrompt,
    onToolCall,
  };
}

// ─── Specialist Agent Config ───────────────────────────────────

async function buildSpecialistConfig(agentKey: string, clientContext?: Record<string, unknown>): Promise<{
  extraTools: Anthropic.Tool[];
  extraSystemPrompt: string;
  onToolCall: (
    name: string,
    input: Record<string, unknown>,
    send: (event: string, data: unknown) => void
  ) => Promise<string | null>;
}> {
  // Route to specialist-specific handlers
  switch (agentKey) {
    case "plans-architect": {
      const { extraPrompt, allPlans } = await buildPlanAgentContext();
      return {
        extraTools: PLAN_AGENT_TOOLS,
        extraSystemPrompt: extraPrompt,
        onToolCall: async (name, input, send) =>
          handlePlanAgentToolCall(name, input, send, allPlans),
      };
    }

    case "projections-architect": {
      const { extraPrompt } = await buildProjectionsAgentContext(clientContext);
      return {
        extraTools: PROJECTIONS_AGENT_TOOLS,
        extraSystemPrompt: extraPrompt,
        onToolCall: async (name, input, send) =>
          handleProjectionsToolCall(name, input, send),
      };
    }

    default:
      return {
        extraTools: [],
        extraSystemPrompt: "",
        onToolCall: async () => null,
      };
  }
}

// ─── Orchestrator Config ───────────────────────────────────────

async function buildOrchestratorConfig(userId: string): Promise<{
  extraTools: Anthropic.Tool[];
  extraSystemPrompt: string;
  onToolCall: (
    name: string,
    input: Record<string, unknown>,
    send: (event: string, data: unknown) => void
  ) => Promise<string | null>;
}> {
  const { buildActionCatalog } = await import("@/lib/blocks/registry");
  const actionCatalog = buildActionCatalog();

  const extraSystemPrompt = `You are the HERD AI assistant — the main orchestrator agent with access to ALL blocks and capabilities across the platform.

You can search any data and execute any action across all blocks.

=== AVAILABLE ACTIONS ===
${actionCatalog}`;

  const onToolCall = async (
    toolName: string,
    toolInput: Record<string, unknown>,
    send: (event: string, data: unknown) => void
  ): Promise<string | null> => {
    if (toolName === "execute_action") {
      const actionName = toolInput.action as string;
      const actionParams = (toolInput.params as Record<string, unknown>) || {};
      const result = await executeAction(actionName, actionParams, userId);
      const formatted = formatActionResult(result);

      if (result.success) {
        const entry = actionToBlock.get(actionName);
        if (entry) {
          const actionType = entry.action.method === "DELETE"
            ? "deleted"
            : entry.action.method === "POST"
              ? "created"
              : "updated";
          send("activity", {
            type: actionType,
            label: `${actionType} via ${actionName}`,
            blockName: entry.block.name,
          });
        }
      }

      return formatted;
    }

    if (toolName === "search_data") {
      const results = await searchData(
        toolInput as {
          item_ids?: string[];
          keyword?: string;
          types?: string[];
        }
      );
      return results.length > 0
        ? results
            .map(
              (r) =>
                `=== ${r.type.toUpperCase()}: ${r.name} [${r.id}] ===\n${r.content}`
            )
            .join("\n\n")
        : "No results found.";
    }

    return null;
  };

  return {
    extraTools: [SEARCH_DATA_TOOL, EXECUTE_ACTION_TOOL],
    extraSystemPrompt,
    onToolCall,
  };
}
